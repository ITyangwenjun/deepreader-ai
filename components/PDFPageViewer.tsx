import React, { useEffect, useRef, useState } from 'react';
import { base64ToArrayBuffer } from '../services/bookParser';
import { Loader2 } from 'lucide-react';

interface PDFPageViewerProps {
    pdfData: string; // base64 encoded PDF
    pageNumber: number;
    scale?: number;
}

const PDFPageViewer: React.FC<PDFPageViewerProps> = ({ pdfData, pageNumber, scale = 1.5 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const renderPage = async () => {
            if (!pdfData || !canvasRef.current) return;

            setIsLoading(true);
            setError(null);

            try {
                const pdfjsLib = await import('pdfjs-dist');
                const version = pdfjsLib.version;
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = base64ToArrayBuffer(pdfData);

                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    useWorkerFetch: false,
                    isEvalSupported: false,
                    useSystemFonts: true
                });

                const pdf = await loadingTask.promise;

                if (cancelled) return;

                const page = await pdf.getPage(pageNumber);

                if (cancelled) return;

                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context) {
                    setError('无法创建画布上下文');
                    return;
                }

                // 设置高清渲染
                const outputScale = window.devicePixelRatio || 1;
                canvas.width = Math.floor(viewport.width * outputScale);
                canvas.height = Math.floor(viewport.height * outputScale);
                canvas.style.width = Math.floor(viewport.width) + 'px';
                canvas.style.height = Math.floor(viewport.height) + 'px';

                const transform = outputScale !== 1
                    ? [outputScale, 0, 0, outputScale, 0, 0]
                    : undefined;

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                    transform: transform
                }).promise;

                if (!cancelled) {
                    setIsLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('PDF render error:', err);
                    setError('页面渲染失败');
                    setIsLoading(false);
                }
            }
        };

        renderPage();

        return () => {
            cancelled = true;
        };
    }, [pdfData, pageNumber, scale]);

    return (
        <div className="flex flex-col items-center justify-center w-full">
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-slate-500">正在渲染页面...</span>
                </div>
            )}
            {error && (
                <div className="text-red-500 py-10">{error}</div>
            )}
            <canvas
                ref={canvasRef}
                className={`max-w-full shadow-lg rounded-lg ${isLoading ? 'hidden' : 'block'}`}
            />
        </div>
    );
};

export default PDFPageViewer;
