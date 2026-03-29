// ============================================================
// The Economist Study App - データ型定義
// Design: Editorial Brutalism
// ============================================================

export type WordMarkType = "unknown" | "unsure";

export interface MarkedWord {
  word: string;
  markType: WordMarkType;
  sentenceIndex: number; // どの文の何番目の単語か
  wordIndex: number;
}

export interface VocabItem {
  word: string;
  definition: string;
}

export interface Sentence {
  english: string;
  japanese: string;
}

export interface Paragraph {
  id: string;
  title: string; // 段落タイトル（例：「混迷を極めるトランプ大統領の対イラン政策」）
  sentences: Sentence[];
  vocabulary: VocabItem[];
  markedWords: MarkedWord[];
}

export type ReviewMethod = "読む" | "聞く" | "書く" | "音読" | "その他";

export interface ReviewRecord {
  id: string;
  date: string; // ISO 8601
  method: ReviewMethod | string;
  note?: string;
}

export interface Article {
  id: string;
  title: string;
  paragraphs: Paragraph[];
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
