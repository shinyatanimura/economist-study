// ============================================================
// The Economist Study App - LocalStorage 永続化ユーティリティ
// Structure: Week → Article → Sentence (段落レベルは廃止)
// ============================================================

import type { AppData, Week, Article, Sentence, MarkedWord, ReviewRecord } from "./types";
import { nanoid } from "nanoid";

const STORAGE_KEY = "economist-study-data";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { weeks: [] };
    return JSON.parse(raw) as AppData;
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
  patch: Partial<Pick<Article, "title" | "sentences" | "markedWords">>
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
