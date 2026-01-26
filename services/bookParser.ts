import { Book } from '../types';

// 生成唯一ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化日期
const formatDate = (): string => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
};

// 解析PDF文件
export const parsePDF = async (file: File): Promise<Book> => {
    // 动态加载 pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // 使用 jsdelivr CDN
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();

    // 先转换为base64（在ArrayBuffer被消费前）
    const pdfBase64 = arrayBufferToBase64(arrayBuffer);

    // 从base64重新创建ArrayBuffer用于PDF解析
    const pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);

    // 配置加载选项
    const loadingTask = pdfjsLib.getDocument({
        data: pdfArrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
    });

    const pdf = await loadingTask.promise;

    // 获取元数据
    const metadata = await pdf.getMetadata();
    const info = metadata.info as any;

    // 提取标题和作者
    const title = info?.Title || file.name.replace('.pdf', '');
    const author = info?.Author || '未知作者';
    const totalPages = pdf.numPages;

    // 生成封面（第一页的缩略图）
    let coverUrl = '';
    try {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await firstPage.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            coverUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
    } catch (error) {
        console.error('Error generating cover:', error);
    }

    // 提取每页文本用于AI分析（但不用于显示）
    const textPages: string[] = [];
    for (let i = 1; i <= Math.min(totalPages, 50); i++) {
        try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            textPages.push(pageText);
        } catch {
            textPages.push('');
        }
    }

    return {
        id: generateId(),
        title,
        author,
        coverUrl,
        dateAdded: formatDate(),
        status: 'unread',
        // 存储PDF数据和文本
        content: JSON.stringify({
            type: 'pdf',
            pdfData: pdfBase64,
            textPages: textPages
        }),
        totalPages: totalPages,
        currentPage: 1
    };
};

// ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Base64 转 ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// 解析EPUB文件
export const parseEPUB = async (file: File): Promise<Book> => {
    // 使用 JSZip 解析 EPUB（EPUB本质上是ZIP格式）
    const JSZip = (await import('jszip')).default;

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 查找 container.xml
    const containerXml = await zip.file('META-INF/container.xml')?.async('text');
    if (!containerXml) {
        throw new Error('Invalid EPUB file: missing container.xml');
    }

    // 解析 container.xml 获取 content.opf 路径
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const rootfilePath = containerDoc.querySelector('rootfile')?.getAttribute('full-path') || '';

    // 解析 content.opf
    const opfContent = await zip.file(rootfilePath)?.async('text');
    if (!opfContent) {
        throw new Error('Invalid EPUB file: missing content.opf');
    }

    const opfDoc = parser.parseFromString(opfContent, 'application/xml');

    // 提取元数据
    const title = opfDoc.querySelector('title')?.textContent || file.name.replace('.epub', '');
    const author = opfDoc.querySelector('creator')?.textContent || '未知作者';

    // 获取封面
    let coverUrl = '';
    const coverMeta = opfDoc.querySelector('meta[name="cover"]');
    if (coverMeta) {
        const coverId = coverMeta.getAttribute('content');
        const coverItem = opfDoc.querySelector(`item[id="${coverId}"]`);
        const coverHref = coverItem?.getAttribute('href');

        if (coverHref) {
            // 获取 OPF 文件所在目录
            const opfDir = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1);
            const coverPath = opfDir + coverHref;

            const coverData = await zip.file(coverPath)?.async('base64');
            if (coverData) {
                const mediaType = coverItem?.getAttribute('media-type') || 'image/jpeg';
                coverUrl = `data:${mediaType};base64,${coverData}`;
            }
        }
    }

    // 提取内容（spine顺序）
    const spine = opfDoc.querySelectorAll('spine itemref');
    const manifest = opfDoc.querySelectorAll('manifest item');

    const manifestMap = new Map<string, string>();
    manifest.forEach(item => {
        const id = item.getAttribute('id') || '';
        const href = item.getAttribute('href') || '';
        manifestMap.set(id, href);
    });

    let content = '';
    const opfDir = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1);
    let pageCount = 0;

    for (const itemref of Array.from(spine).slice(0, 10)) {
        const idref = itemref.getAttribute('idref') || '';
        const href = manifestMap.get(idref);

        if (href) {
            const contentPath = opfDir + href;
            const htmlContent = await zip.file(contentPath)?.async('text');

            if (htmlContent) {
                // 提取 body 内容
                const htmlDoc = parser.parseFromString(htmlContent, 'application/xhtml+xml');
                const body = htmlDoc.querySelector('body');
                if (body) {
                    pageCount++;
                    content += `<div class="chapter mb-8">${body.innerHTML}</div>`;
                }
            }
        }
    }

    return {
        id: generateId(),
        title,
        author,
        coverUrl,
        dateAdded: formatDate(),
        status: 'unread',
        content: `
      <header class="mb-12 text-center">
        <h1 class="text-4xl font-bold dark:text-white mb-4">${title}</h1>
        <p class="text-slate-500 italic">${author}</p>
      </header>
      <article class="text-xl text-slate-800 dark:text-slate-200 leading-loose selection:bg-primary/30">
        ${content}
      </article>
    `,
        totalPages: pageCount,
        currentPage: 1
    };
};

// 主解析函数
export const parseBook = async (file: File): Promise<Book> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return parsePDF(file);
        case 'epub':
            return parseEPUB(file);
        default:
            throw new Error(`Unsupported file format: ${extension}`);
    }
};

// 验证文件
export const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedExtensions = ['pdf', 'epub'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
        return { valid: false, error: '不支持的文件格式，请上传 PDF 或 EPUB 文件' };
    }

    // 使用IndexedDB后可支持更大文件
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (file.size > maxSize) {
        return { valid: false, error: '文件大小超过100MB限制' };
    }

    return { valid: true };
};
