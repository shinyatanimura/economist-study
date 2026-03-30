// ============================================================
// The Economist Study App - データ型定義
// Design: Editorial Brutalism
// Structure: Week → Article → Sentence (段落レベルは廃止)
// 後方互換ポリシー: 新フィールドはすべてオプショナル(?)で追加
// ============================================================

export type WordMarkType = "unknown" | "unsure";

export interface MarkedWord {
  word: string;
  markType: WordMarkType;
  sentenceIndex: number;
  wordIndex: number;
}

// 熟語: 複数の wordIndex をまとめて1エントリとして扱う
// isPhrase=true の場合は wordIndices に含まれる単語をまとめて表示
export interface VocabItem {
  word: string;
  definition: string;
  isPhrase?: boolean;        // 熟語フラグ（後方互換: 既存データはundefined=false扱い）
  wordIndices?: number[];    // 熟語を構成する wordIndex の配列（sentenceIndex は親のMarkedWordから参照）
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

// 単語一覧タブでのチェック状態（マーキングとは独立）
// key: `${sentenceIndex}-${wordIndex}`
export type WordCheckMap = Record<string, boolean>;

export interface Article {
  id: string;
  title: string;
  sentences: Sentence[];
  markedWords: MarkedWord[];
  reviewRecords: ReviewRecord[];
  createdAt: string;
  note?: string;             // 記事メモ（後方互換: 既存データはundefined=空欄扱い）
  wordChecks?: WordCheckMap; // 単語一覧チェック状態（後方互換: 既存データはundefined={}扱い）
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
