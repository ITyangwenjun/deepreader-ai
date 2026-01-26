import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Book } from './types';
import { getBooks, removeBook, getSettings, saveSettings, initStorage, AISettings } from './services/bookStorage';
import Library from './components/Library';
import Reader from './components/Reader';
import UploadModal from './components/UploadModal';
import SettingsModal from './components/SettingsModal';
import {
  BookOpen, UploadCloud, BarChart2, Settings, Loader2
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LIBRARY);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化
  useEffect(() => {
    const init = async () => {
      await initStorage();
      const [loadedBooks, loadedSettings] = await Promise.all([
        getBooks(),
        getSettings()
      ]);
      setBooks(loadedBooks);
      setAiSettings(loadedSettings);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleBookSelect = (book: Book) => {
    setCurrentBook(book);
    setView(ViewState.READER);
  };

  const handleBackToLibrary = async () => {
    setView(ViewState.LIBRARY);
    setCurrentBook(null);
    // 刷新书籍列表
    const updatedBooks = await getBooks();
    setBooks(updatedBooks);
  };

  const handleBookAdded = useCallback(async (book: Book) => {
    const updatedBooks = await getBooks();
    setBooks(updatedBooks);
  }, []);

  const handleDeleteBook = useCallback(async (bookId: string) => {
    const updatedBooks = await removeBook(bookId);
    setBooks(updatedBooks);
  }, []);

  const handleSettingsChange = useCallback(async (settings: AISettings) => {
    await saveSettings(settings);
    setAiSettings(settings);
  }, []);

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-500">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar - Only visible in Library view */}
      {view === ViewState.LIBRARY && (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col shrink-0">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <h2 className="text-lg font-bold leading-tight tracking-tight">DeepReader AI</h2>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 flex-1">
            <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <BookOpen size={20} />
              <span className="text-sm font-medium">我的书库</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-not-allowed">
              <BarChart2 size={20} />
              <span className="text-sm font-medium">阅读统计</span>
            </a>
            <a
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Settings size={20} />
              <span className="text-sm font-medium">系统设置</span>
            </a>
          </nav>

          <div className="p-4 mt-auto">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                DR
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">DeepReader</p>
                <p className="text-xs text-slate-500">免费版</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        {view === ViewState.LIBRARY && (
          <Library
            books={books}
            onBookSelect={handleBookSelect}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onDeleteBook={handleDeleteBook}
          />
        )}
        {view === ViewState.READER && currentBook && (
          <Reader
            book={currentBook}
            onBack={handleBackToLibrary}
            aiSettings={aiSettings || undefined}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onBookAdded={handleBookAdded}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  );
};

export default App;
