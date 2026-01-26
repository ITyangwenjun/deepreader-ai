export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  dateAdded: string;
  status: 'unread' | 'reading' | 'completed';
  content?: string; // HTML content for the reader
  totalPages?: number;
  currentPage?: number;
}

export interface AIAnalysisResult {
  summary: string;
  points: {
    title: string;
    description: string;
  }[];
}

export enum ViewState {
  LIBRARY = 'LIBRARY',
  READER = 'READER'
}

export type AIProviderType = 'deepseek' | 'qwen' | 'kimi' | 'gemini' | 'openai';
