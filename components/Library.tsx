import React, { useState } from 'react';
import { Book } from '../types';
import {
  Search, Plus, ChevronDown, LayoutGrid, List,
  MoreVertical, Book as BookIcon, Trash2, BookOpenCheck
} from 'lucide-react';

interface LibraryProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
  onUploadClick: () => void;
  onDeleteBook?: (bookId: string) => void;
}

const Library: React.FC<LibraryProps> = ({ books, onBookSelect, onUploadClick, onDeleteBook }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这本书吗？')) {
      onDeleteBook?.(bookId);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-50/50 dark:bg-slate-900/20">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">我的书库</h1>
          <p className="text-sm text-slate-500">管理并分析您的数字馆藏 · 共 {books.length} 本书</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={16} />
            </div>
            <input
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm w-72 focus:ring-1 focus:ring-primary placeholder:text-slate-500 outline-none dark:text-white"
              placeholder="通过书名或作者搜索..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={onUploadClick}
            className="bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            上传新书
          </button>
        </div>
      </header>

      {/* Filters & Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {['类型: 全部', '日期: 最近添加', '状态: 全部'].map((filter, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:border-primary transition-colors text-slate-700 dark:text-slate-300">
                <span className="text-slate-500">{filter.split(':')[0]}:</span> {filter.split(':')[1]}
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            ))}
          </div>
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button className="p-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-primary">
              <LayoutGrid size={18} />
            </button>
            <button className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <BookOpenCheck size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery ? '未找到匹配的书籍' : '书库空空如也'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery ? '尝试使用其他关键词搜索' : '上传您的第一本书，开始智能阅读之旅'}
            </p>
            {!searchQuery && (
              <button
                onClick={onUploadClick}
                className="bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all"
              >
                <Plus size={18} />
                上传新书
              </button>
            )}
          </div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-primary transition-all hover:shadow-xl hover:shadow-black/5 flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                  <button
                    onClick={() => onBookSelect(book)}
                    className="w-full bg-white text-slate-900 font-bold py-2 rounded-lg text-sm hover:bg-slate-100"
                  >
                    立即阅读
                  </button>
                </div>
                <div className="w-32 h-44 shadow-2xl relative transition-transform group-hover:scale-105 duration-300">
                  {book.coverUrl ? (
                    <img
                      alt={book.title}
                      className="w-full h-full object-cover rounded shadow-md"
                      src={book.coverUrl}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-400/20 dark:from-slate-700 dark:to-slate-600 flex flex-col items-center justify-center text-slate-400 rounded border border-slate-200 dark:border-slate-600">
                      <BookIcon size={32} />
                      <span className="text-[10px] font-bold mt-2 px-2 text-center line-clamp-2">{book.title}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-bold text-sm line-clamp-2 leading-snug text-slate-900 dark:text-white" title={book.title}>{book.title}</h3>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === book.id ? null : book.id);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 shrink-0"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === book.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-20 min-w-[120px]">
                        <button
                          onClick={() => onBookSelect(book)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <BookIcon size={14} />
                          阅读
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, book.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4">{book.author}</p>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{book.dateAdded}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${book.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      book.status === 'reading' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-blue-500/10 text-blue-500'
                    }`}>
                    {book.status === 'completed' ? '已读' : book.status === 'reading' ? '阅读中' : '未读'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Library;
