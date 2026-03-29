// ============================================================
// The Economist Study App - データ型定義
// Design: Editorial Brutalism
// Structure: Week → Article → Sentence (段落レベルは廃止)
// ============================================================

export type WordMarkType = "unknown" | "unsure";

export interface MarkedWord {
  word: string;
  markType: WordMarkType;
  sentenceIndex: number;
  wordIndex: number;
}

export interface VocabItem {
  word: string;
  definition: string;
}

export interface Sentence {
  english: string;
  japanese: string;
  vocabulary: VocabItem[]; // 各文に紐づく語彙
}

export type ReviewMethod = string; // 自由入力

export interface ReviewRecord {
  id: string;
  date: string; // ISO 8601
  method: ReviewMethod;
  note?: string;
}

export interface Article {
  id: string;
  title: string;
  sentences: Sentence[];
  markedWords: MarkedWord[];
  reviewRecords: ReviewRecord[];
  createdAt: string;
}

export interface Week {
  id: string;
  label: string; // 例: "2025年3月第3週"
  issueDate: string; // 発行日 ISO 8601
  articles: Article[];
}

export interface AppData {
  weeks: Week[];
}
