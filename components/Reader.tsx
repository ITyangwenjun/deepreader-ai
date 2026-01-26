import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Book, AIAnalysisResult, AIProviderType } from '../types';
import { AISettings, getSettingsSync, updateBook } from '../services/bookStorage';
import { DeepSeekProvider, QwenProvider, KimiProvider, GeminiProvider, OpenAIProvider } from '../services/providers';
import { AIProvider } from '../services/aiService';
import PDFPageViewer from './PDFPageViewer';
import {
  ArrowLeft, Settings, Search, ChevronLeft, ChevronRight,
  AlignJustify, Palette, Bookmark, Share2,
  BrainCircuit, Copy, X, Send, Save, ThumbsUp, ThumbsDown, BookOpen,
  AlertCircle, Loader2, ZoomIn, ZoomOut
} from 'lucide-react';

interface ReaderProps {
  book: Book;
  onBack: () => void;
  aiSettings?: AISettings;
  onOpenSettings?: () => void;
}

const providers: Record<AIProviderType, AIProvider> = {
  deepseek: DeepSeekProvider,
  qwen: QwenProvider,
  kimi: KimiProvider,
  gemini: GeminiProvider,
  openai: OpenAIProvider
};

const Reader: React.FC<ReaderProps> = ({ book, onBack, aiSettings, onOpenSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [settings, setSettings] = useState<AISettings>(aiSettings || getSettingsSync());
  const [currentProvider, setCurrentProvider] = useState<AIProviderType>(settings.provider);
  const [currentModel, setCurrentModel] = useState<string>(settings.model);
  const [currentPage, setCurrentPage] = useState(book.currentPage || 1);
  const [pdfScale, setPdfScale] = useState(1.2);
  const contentRef = useRef<HTMLDivElement>(null);

  // 解析内容类型
  const contentData = useMemo(() => {
    if (!book.content) return null;
    try {
      const parsed = JSON.parse(book.content);
      if (parsed.type === 'pdf' && parsed.pdfData) {
        return { type: 'pdf' as const, pdfData: parsed.pdfData, textPages: parsed.textPages || [] };
      }
      if (Array.isArray(parsed)) {
        return { type: 'text' as const, pages: parsed };
      }
      return { type: 'html' as const, content: book.content };
    } catch {
      return { type: 'html' as const, content: book.content };
    }
  }, [book.content]);

  // 获取当前页文本（用于AI分析）
  const getCurrentPageText = (): string => {
    if (!contentData) return '';
    if (contentData.type === 'pdf') {
      return contentData.textPages[currentPage - 1] || '';
    }
    if (contentData.type === 'text') {
      return contentData.pages[currentPage - 1] || '';
    }
    return book.content?.replace(/<[^>]*>/g, ' ').substring(0, 2000) || '';
  };

  // 翻页函数
  const goToPage = (page: number) => {
    const totalPages = book.totalPages || 1;
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    // 异步保存阅读进度（不阻塞UI）
    updateBook(book.id, { currentPage: newPage, status: 'reading' }).catch(console.error);
    // 滚动到顶部
    contentRef.current?.scrollTo(0, 0);
  };

  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // 更新设置
  useEffect(() => {
    if (aiSettings) {
      setSettings(aiSettings);
      setCurrentProvider(aiSettings.provider);
      setCurrentModel(aiSettings.model);
    }
  }, [aiSettings]);

  // 监听文本选择
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 10) {
        setSelectedText(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const handleProviderChange = (provider: AIProviderType) => {
    setCurrentProvider(provider);
    const providerConfig = providers[provider];
    if (providerConfig.models.length > 0) {
      setCurrentModel(providerConfig.models[0].id);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt.trim() && !selectedText) {
      setError('请输入提示词或选择一段文本');
      return;
    }

    const apiKey = settings.apiKeys[currentProvider];
    if (!apiKey) {
      setError(`请先在设置中配置 ${providers[currentProvider].displayName} 的 API Key`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const provider = providers[currentProvider];
      // 获取当前页内容用于分析
      const textToAnalyze = selectedText || getCurrentPageText();

      const result = await provider.analyze(
        textToAnalyze,
        prompt || '请分析这段文本的主要内容和含义',
        currentModel,
        apiKey
      );

      setAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const currentProviderConfig = providers[currentProvider];

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      {/* Top Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-white dark:bg-background-dark z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
            <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">DeepReader AI</h2>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={onBack} className="text-sm font-medium hover:text-primary transition-colors text-slate-600 dark:text-slate-300">书库</button>
            <span className="text-sm font-medium text-primary">当前阅读</span>
            <span className="text-sm font-medium hover:text-primary transition-colors text-slate-600 dark:text-slate-300 cursor-not-allowed">笔记本</span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={14} />
            </div>
            <input
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary placeholder:text-slate-500 outline-none dark:text-white"
              placeholder="搜索标注..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="text-slate-600 dark:text-slate-300" size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Main Reading Area */}
        <section className="flex-1 flex flex-col bg-white dark:bg-[#151c2c] overflow-hidden border-r border-slate-200 dark:border-slate-800 relative">
          {/* Format Toolbar */}
          <div className="flex justify-between items-center px-8 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 whitespace-nowrap">版式设置</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg mr-2">
                <button className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all text-slate-600 dark:text-slate-300"><span className="text-xs">A-</span></button>
                <span className="text-[10px] font-bold px-1 text-slate-400">字体大小</span>
                <button className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all text-slate-600 dark:text-slate-300"><span className="text-sm">A+</span></button>
              </div>
              <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-2"></div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-300">
                <AlignJustify size={16} /> <span className="text-xs font-medium hidden sm:inline">行间距</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-300">
                <Palette size={16} /> <span className="text-xs font-medium hidden sm:inline">背景色</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"><Bookmark size={18} className="text-slate-400" /></button>
              <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"><Share2 size={18} className="text-slate-400" /></button>
            </div>
          </div>

          {/* Book Content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8"
          >
            {/* PDF渲染模式 */}
            {contentData?.type === 'pdf' && (
              <div className="flex flex-col items-center">
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setPdfScale(Math.max(0.5, pdfScale - 0.2))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    title="缩小"
                  >
                    <ZoomOut size={18} className="text-slate-500" />
                  </button>
                  <span className="text-sm text-slate-500">{Math.round(pdfScale * 100)}%</span>
                  <button
                    onClick={() => setPdfScale(Math.min(3, pdfScale + 0.2))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    title="放大"
                  >
                    <ZoomIn size={18} className="text-slate-500" />
                  </button>
                </div>
                <PDFPageViewer
                  pdfData={contentData.pdfData}
                  pageNumber={currentPage}
                  scale={pdfScale}
                />
              </div>
            )}

            {/* 文本渲染模式 */}
            {contentData?.type === 'text' && (
              <div className="max-w-2xl mx-auto font-serif">
                <header className="mb-12 text-center">
                  <h3 className="text-slate-400 text-sm font-medium tracking-[0.2em] uppercase mb-2">第 {currentPage} 页</h3>
                  <h1 className="text-3xl font-bold dark:text-white mb-4">{book.title}</h1>
                  <p className="text-slate-500 italic">{book.author}</p>
                </header>
                <article className="text-xl text-slate-800 dark:text-slate-200 leading-loose selection:bg-primary/30">
                  <p className="mb-6 whitespace-pre-wrap">{contentData.pages[currentPage - 1] || '此页无内容'}</p>
                </article>
              </div>
            )}

            {/* HTML渲染模式（兼容旧数据） */}
            {contentData?.type === 'html' && (
              <div
                className="max-w-2xl mx-auto font-serif"
                dangerouslySetInnerHTML={{ __html: contentData.content }}
              />
            )}

            {/* 无内容 */}
            {!contentData && (
              <div className="flex items-center justify-center h-full text-slate-500">
                内容加载中...
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-6 text-sm font-medium text-slate-500">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className={`flex items-center gap-1 transition-colors ${currentPage <= 1 ? 'text-slate-300 cursor-not-allowed' : 'hover:text-primary'}`}
            >
              <ChevronLeft size={16} /> 上一页
            </button>
            <div className="flex items-center gap-2">
              <span>第</span>
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value) || 1;
                  goToPage(page);
                }}
                className="w-16 text-center bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                min={1}
                max={book.totalPages || 1}
              />
              <span>页，共 {book.totalPages || 1} 页</span>
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= (book.totalPages || 1)}
              className={`flex items-center gap-1 transition-colors ${currentPage >= (book.totalPages || 1) ? 'text-slate-300 cursor-not-allowed' : 'hover:text-primary'}`}
            >
              下一页 <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* AI Sidebar */}
        <aside className="w-[420px] bg-background-light dark:bg-background-dark flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-800 shadow-2xl z-20">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-primary mb-1">
              <BrainCircuit size={20} />
              <h2 className="text-sm font-bold uppercase tracking-widest">AI 智能分析面板</h2>
            </div>
            <p className="text-xs text-slate-500">选择文本或输入问题，获取深度分析。</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Current Page Context for PDF */}
            {contentData?.type === 'pdf' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">当前页内容（第 {currentPage} 页）</label>
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-serif whitespace-pre-wrap">
                      {getCurrentPageText() || '此页未提取到文本内容'}
                    </p>
                  </div>
                  {getCurrentPageText() && (
                    <button
                      onClick={() => setSelectedText(getCurrentPageText())}
                      className="mt-3 text-xs text-primary hover:text-blue-600 font-medium"
                    >
                      使用此内容进行分析 →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Selection Context */}
            {selectedText && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">已选内容</label>
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                  <div className="max-h-32 overflow-y-auto custom-scrollbar">
                    <p className="text-sm italic leading-relaxed text-slate-600 dark:text-slate-300 font-serif whitespace-pre-wrap">
                      {selectedText}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(selectedText)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={clearSelection}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Provider Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">AI 提供商</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(providers).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key as AIProviderType)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${currentProvider === key
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {provider.displayName.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">AI 模型</label>
              <div className="relative">
                <select
                  value={currentModel}
                  onChange={(e) => setCurrentModel(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none dark:text-white"
                >
                  {currentProviderConfig.models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronRight className="rotate-90" size={16} />
                </div>
              </div>
            </div>

            {/* Input Prompt */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">输入提示词</label>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none min-h-[100px] resize-none placeholder:text-slate-400 dark:text-white"
                  placeholder="输入提示词进行分析...例如：分析这段文字的写作手法"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`absolute bottom-3 right-3 p-2 rounded-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center ${isAnalyzing
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                    : 'bg-primary hover:bg-blue-600 text-white shadow-primary/20'
                    }`}
                >
                  {isAnalyzing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  {error.includes('API Key') && (
                    <button
                      onClick={onOpenSettings}
                      className="text-sm text-primary hover:underline mt-1"
                    >
                      打开设置 →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Output */}
            {analysis && (
              <div className="space-y-3 pt-2 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">输出结果</label>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                    {currentProviderConfig.displayName}
                  </span>
                </div>
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                    <BookOpen className="text-primary" size={18} />
                    深度文本解析
                  </h4>
                  <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <p>{analysis.summary}</p>
                    {analysis.points.length > 0 && (
                      <>
                        <p className="font-medium text-slate-800 dark:text-slate-100 mt-4">核心分析：</p>
                        <ul className="list-disc pl-5 space-y-2">
                          {analysis.points.map((point, idx) => (
                            <li key={idx}>
                              <span className="font-semibold text-primary">{point.title}：</span> {point.description}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                    >
                      <Copy size={16} /> 复制结果
                    </button>
                    <div className="flex gap-2">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><ThumbsUp size={16} /></button>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><ThumbsDown size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold shrink-0">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${settings.apiKeys[currentProvider] ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {settings.apiKeys[currentProvider] ? 'AI 已就绪' : '需配置 API Key'}
              </span>
              <span>v2.0.0</span>
            </div>
            <div className="flex gap-4">
              <span>{currentProviderConfig.displayName}</span>
            </div>
          </footer>
        </aside>
      </main>
    </div>
  );
};

export default Reader;
