// ============================================================
// The Economist Study App - LocalStorage 永続化ユーティリティ
// Structure: Week → Article → Sentence (段落レベルは廃止)
// 後方互換ポリシー: loadData時に不足フィールドをデフォルト値で補完
// ============================================================

import type { AppData, Week, Article, Sentence, MarkedWord, ReviewRecord, VocabItem, WordCheckMap } from "./types";
import { nanoid } from "nanoid";

const STORAGE_KEY = "economist-study-data";

// 既存データに不足フィールドを補完するマイグレーション
function migrateData(raw: AppData): AppData {
  return {
    ...raw,
    weeks: (raw.weeks ?? []).map((w) => ({
      ...w,
      articles: (w.articles ?? []).map((a) => ({
        note: "",
        wordChecks: {},
        ...a,
        sentences: (a.sentences ?? []).map((s) => ({
          ...s,
          vocabulary: (s.vocabulary ?? []).map((v) => ({
            isPhrase: false,
            wordIndices: [],
            ...v,
          })),
        })),
        markedWords: a.markedWords ?? [],
        reviewRecords: a.reviewRecords ?? [],
      })),
    })),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { weeks: [] };
    return migrateData(JSON.parse(raw) as AppData);
  } catch {
    return { weeks: [] };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- Week operations ----

export function addWeek(data: AppData, label: string, issueDate: string): AppData {
  const week: Week = { id: nanoid(), label, issueDate, articles: [] };
  return { ...data, weeks: [...data.weeks, week] };
}

export function updateWeek(data: AppData, weekId: string, patch: Partial<Pick<Week, "label" | "issueDate">>): AppData {
  return { ...data, weeks: data.weeks.map((w) => (w.id === weekId ? { ...w, ...patch } : w)) };
}

export function deleteWeek(data: AppData, weekId: string): AppData {
  return { ...data, weeks: data.weeks.filter((w) => w.id !== weekId) };
}

// ---- Article operations ----

export function addArticle(data: AppData, weekId: string, title: string): AppData {
  const article: Article = {
    id: nanoid(),
    title,
    sentences: [],
    markedWords: [],
    reviewRecords: [],
    note: "",
    wordChecks: {},
    createdAt: new Date().toISOString(),
  };
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId ? { ...w, articles: [...w.articles, article] } : w
    ),
  };
}

export function updateArticle(
  data: AppData,
  weekId: string,
  articleId: string,
  patch: Partial<Pick<Article, "title" | "sentences" | "markedWords" | "note" | "wordChecks">>
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? { ...w, articles: w.articles.map((a) => (a.id === articleId ? { ...a, ...patch } : a)) }
        : w
    ),
  };
}

export function deleteArticle(data: AppData, weekId: string, articleId: string): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId ? { ...w, articles: w.articles.filter((a) => a.id !== articleId) } : w
    ),
  };
}

// ---- Sentence operations ----

export function setSentences(data: AppData, weekId: string, articleId: string, sentences: Sentence[]): AppData {
  return updateArticle(data, weekId, articleId, { sentences });
}

// ---- Marked word operations ----

export function toggleMarkedWord(
  data: AppData,
  weekId: string,
  articleId: string,
  word: MarkedWord
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) => {
              if (a.id !== articleId) return a;
              const existing = a.markedWords.find(
                (m) => m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex
              );
              if (!existing) {
                return { ...a, markedWords: [...a.markedWords, word] };
              } else if (existing.markType === "unknown") {
                return {
                  ...a,
                  markedWords: a.markedWords.map((m) =>
                    m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex
                      ? { ...m, markType: "unsure" as const }
                      : m
                  ),
                };
              } else {
                return {
                  ...a,
                  markedWords: a.markedWords.filter(
                    (m) => !(m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex)
                  ),
                };
              }
            }),
          }
        : w
    ),
  };
}

// ---- Bulk mark words (熟語登録時に複数単語を一括でマーキング) ----
// 既存マーキングを上書きせず、指定単語を強制的に指定markTypeに設定する
export function addMarkedWords(
  data: AppData,
  weekId: string,
  articleId: string,
  words: MarkedWord[]
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) => {
              if (a.id !== articleId) return a;
              // 既存リストをベースに、指定単語を追加または上書き
              let updated = [...a.markedWords];
              for (const word of words) {
                const idx = updated.findIndex(
                  (m) => m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex
                );
                if (idx === -1) {
                  updated = [...updated, word];
                } else {
                  updated = updated.map((m, i) => (i === idx ? { ...m, markType: word.markType } : m));
                }
              }
              return { ...a, markedWords: updated };
            }),
          }
        : w
    ),
  };
}

// ---- Vocabulary operations ----

export function addVocabItem(
  data: AppData,
  weekId: string,
  articleId: string,
  sentenceIndex: number,
  item: VocabItem
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) => {
              if (a.id !== articleId) return a;
              const sentences = a.sentences.map((s, i) =>
                i === sentenceIndex
                  ? { ...s, vocabulary: [...s.vocabulary, item] }
                  : s
              );
              return { ...a, sentences };
            }),
          }
        : w
    ),
  };
}

export function deleteVocabItem(
  data: AppData,
  weekId: string,
  articleId: string,
  sentenceIndex: number,
  vocabIndex: number
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) => {
              if (a.id !== articleId) return a;
              const sentences = a.sentences.map((s, i) =>
                i === sentenceIndex
                  ? { ...s, vocabulary: s.vocabulary.filter((_, vi) => vi !== vocabIndex) }
                  : s
              );
              return { ...a, sentences };
            }),
          }
        : w
    ),
  };
}

export function updateVocabItem(
  data: AppData,
  weekId: string,
  articleId: string,
  sentenceIndex: number,
  vocabIndex: number,
  item: VocabItem
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) => {
              if (a.id !== articleId) return a;
              const sentences = a.sentences.map((s, i) =>
                i === sentenceIndex
                  ? { ...s, vocabulary: s.vocabulary.map((v, vi) => (vi === vocabIndex ? item : v)) }
                  : s
              );
              return { ...a, sentences };
            }),
          }
        : w
    ),
  };
}

// ---- Article note operations ----

export function updateArticleNote(
  data: AppData,
  weekId: string,
  articleId: string,
  note: string
): AppData {
  return updateArticle(data, weekId, articleId, { note });
}

// ---- Word check operations (単語一覧チェック、マーキングとは独立) ----

export function setWordCheck(
  data: AppData,
  weekId: string,
  articleId: string,
  key: string,
  checked: boolean
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) => {
              if (a.id !== articleId) return a;
              const wordChecks: WordCheckMap = { ...(a.wordChecks ?? {}), [key]: checked };
              return { ...a, wordChecks };
            }),
          }
        : w
    ),
  };
}

// ---- Review record operations ----

export function addReviewRecord(
  data: AppData,
  weekId: string,
  articleId: string,
  record: Omit<ReviewRecord, "id">
): AppData {
  const newRecord: ReviewRecord = { ...record, id: nanoid() };
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId
                ? { ...a, reviewRecords: [...a.reviewRecords, newRecord] }
                : a
            ),
          }
        : w
    ),
  };
}

export function deleteReviewRecord(
  data: AppData,
  weekId: string,
  articleId: string,
  recordId: string
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId
                ? { ...a, reviewRecords: a.reviewRecords.filter((r) => r.id !== recordId) }
                : a
            ),
          }
        : w
    ),
  };
}
