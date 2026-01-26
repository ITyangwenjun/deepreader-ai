import { Book } from '../types';

const DB_NAME = 'deepreader_db';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';
const SETTINGS_STORE = 'settings';

export interface AISettings {
  provider: 'deepseek' | 'qwen' | 'kimi' | 'gemini' | 'openai';
  model: string;
  apiKeys: {
    deepseek?: string;
    qwen?: string;
    kimi?: string;
    gemini?: string;
    openai?: string;
  };
}

const defaultSettings: AISettings = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKeys: {}
};

// 初始化 IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建书籍存储
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        const booksStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
        booksStore.createIndex('dateAdded', 'dateAdded', { unique: false });
      }

      // 创建设置存储
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
}

// 书籍存储操作
export const getBooks = async (): Promise<Book[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(BOOKS_STORE, 'readonly');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        // 按添加日期排序（最新的在前）
        const books = request.result.sort((a: Book, b: Book) => {
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        });
        resolve(books);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

export const saveBook = async (book: Book): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(BOOKS_STORE, 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.put(book);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving book:', error);
    throw error;
  }
};

export const addBook = async (book: Book): Promise<Book[]> => {
  await saveBook(book);
  return getBooks();
};

export const removeBook = async (bookId: string): Promise<Book[]> => {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(BOOKS_STORE, 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.delete(bookId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    return getBooks();
  } catch (error) {
    console.error('Error removing book:', error);
    return getBooks();
  }
};

export const updateBook = async (bookId: string, updates: Partial<Book>): Promise<Book[]> => {
  try {
    const db = await openDB();
    const book = await getBookById(bookId);

    if (book) {
      const updatedBook = { ...book, ...updates };
      await saveBook(updatedBook);
    }

    return getBooks();
  } catch (error) {
    console.error('Error updating book:', error);
    return getBooks();
  }
};

export const getBookById = async (bookId: string): Promise<Book | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(BOOKS_STORE, 'readonly');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.get(bookId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting book:', error);
    return undefined;
  }
};

// AI设置存储
export const getSettings = async (): Promise<AISettings> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('aiSettings');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { ...defaultSettings, ...result.value } : defaultSettings);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AISettings): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key: 'aiSettings', value: settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const getApiKey = async (provider: string): Promise<string | undefined> => {
  const settings = await getSettings();
  return settings.apiKeys[provider as keyof typeof settings.apiKeys];
};

export const setApiKey = async (provider: string, key: string): Promise<void> => {
  const settings = await getSettings();
  settings.apiKeys[provider as keyof typeof settings.apiKeys] = key;
  await saveSettings(settings);
};

// 同步版本的API（用于兼容现有代码，内部使用缓存）
let cachedSettings: AISettings | null = null;
let cachedBooks: Book[] | null = null;

// 初始化缓存
export const initStorage = async (): Promise<void> => {
  cachedSettings = await getSettings();
  cachedBooks = await getBooks();
};

// 同步获取设置（从缓存）
export const getSettingsSync = (): AISettings => {
  return cachedSettings || defaultSettings;
};

// 同步获取书籍列表（从缓存）
export const getBooksSync = (): Book[] => {
  return cachedBooks || [];
};

// 刷新缓存
export const refreshCache = async (): Promise<void> => {
  cachedBooks = await getBooks();
  cachedSettings = await getSettings();
};
