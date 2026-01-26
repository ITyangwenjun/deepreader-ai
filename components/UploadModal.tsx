import React, { useState, useRef, useCallback } from 'react';
import { X, CloudUpload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { parseBook, validateFile } from '../services/bookParser';
import { saveBook } from '../services/bookStorage';
import { Book } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded?: (book: Book) => void;
}

type UploadStatus = 'idle' | 'validating' | 'parsing' | 'saving' | 'success' | 'error';

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onBookAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setFileName(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setStatus('validating');
    setProgress(10);

    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || '文件验证失败');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setProgress(30);

    try {
      // 解析书籍
      const book = await parseBook(file);
      setProgress(70);

      // 保存到存储
      setStatus('saving');
      await saveBook(book);
      setProgress(100);
      setStatus('success');

      // 通知父组件
      onBookAdded?.(book);

      // 2秒后自动关闭
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : '解析文件时发生错误');
      setStatus('error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card-dark w-[500px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">上传新书</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          {status === 'idle' && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center gap-4 transition-colors cursor-pointer group ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragging
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                <CloudUpload size={32} />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">将文件拖拽至此处</p>
                <p className="text-xs text-slate-500 mt-1">支持 PDF 和 EPUB 格式，最大 50MB</p>
              </div>
              <label className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                浏览文件
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.epub"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}

          {(status === 'validating' || status === 'parsing') && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={32} className="text-primary animate-spin" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                {status === 'validating' ? '正在验证文件...' : '正在解析书籍内容...'}
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">{progress}%</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white mb-1">上传成功！</p>
              <p className="text-sm text-slate-500">书籍已添加到您的书库</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white mb-1">上传失败</p>
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <button
                onClick={resetState}
                className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                重新上传
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
