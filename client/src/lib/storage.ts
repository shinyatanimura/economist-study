// ============================================================
// The Economist Study App - LocalStorage 永続化ユーティリティ
// ============================================================

import type { AppData, Week, Article, Paragraph, MarkedWord, ReviewRecord } from "./types";
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
  const week: Week = {
    id: nanoid(),
    label,
    issueDate,
    articles: [],
  };
  return { ...data, weeks: [...data.weeks, week] };
}

export function updateWeek(data: AppData, weekId: string, patch: Partial<Pick<Week, "label" | "issueDate">>): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) => (w.id === weekId ? { ...w, ...patch } : w)),
  };
}

export function deleteWeek(data: AppData, weekId: string): AppData {
  return { ...data, weeks: data.weeks.filter((w) => w.id !== weekId) };
}

// ---- Article operations ----

export function addArticle(data: AppData, weekId: string, title: string): AppData {
  const article: Article = {
    id: nanoid(),
    title,
    paragraphs: [],
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

export function updateArticle(data: AppData, weekId: string, articleId: string, patch: Partial<Pick<Article, "title">>): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId ? { ...a, ...patch } : a
            ),
          }
        : w
    ),
  };
}

export function deleteArticle(data: AppData, weekId: string, articleId: string): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? { ...w, articles: w.articles.filter((a) => a.id !== articleId) }
        : w
    ),
  };
}

// ---- Paragraph operations ----

export function addParagraph(data: AppData, weekId: string, articleId: string, paragraph: Omit<Paragraph, "id" | "markedWords">): AppData {
  const newParagraph: Paragraph = {
    ...paragraph,
    id: nanoid(),
    markedWords: [],
  };
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId
                ? { ...a, paragraphs: [...a.paragraphs, newParagraph] }
                : a
            ),
          }
        : w
    ),
  };
}

export function updateParagraph(data: AppData, weekId: string, articleId: string, paragraphId: string, patch: Partial<Paragraph>): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId
                ? {
                    ...a,
                    paragraphs: a.paragraphs.map((p) =>
                      p.id === paragraphId ? { ...p, ...patch } : p
                    ),
                  }
                : a
            ),
          }
        : w
    ),
  };
}

export function deleteParagraph(data: AppData, weekId: string, articleId: string, paragraphId: string): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId
                ? { ...a, paragraphs: a.paragraphs.filter((p) => p.id !== paragraphId) }
                : a
            ),
          }
        : w
    ),
  };
}

// ---- Marked word operations ----

export function toggleMarkedWord(
  data: AppData,
  weekId: string,
  articleId: string,
  paragraphId: string,
  word: MarkedWord
): AppData {
  return {
    ...data,
    weeks: data.weeks.map((w) =>
      w.id === weekId
        ? {
            ...w,
            articles: w.articles.map((a) =>
              a.id === articleId
                ? {
                    ...a,
                    paragraphs: a.paragraphs.map((p) => {
                      if (p.id !== paragraphId) return p;
                      const existing = p.markedWords.find(
                        (m) => m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex
                      );
                      if (!existing) {
                        return { ...p, markedWords: [...p.markedWords, word] };
                      } else if (existing.markType === "unknown") {
                        return {
                          ...p,
                          markedWords: p.markedWords.map((m) =>
                            m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex
                              ? { ...m, markType: "unsure" as const }
                              : m
                          ),
                        };
                      } else {
                        return {
                          ...p,
                          markedWords: p.markedWords.filter(
                            (m) => !(m.sentenceIndex === word.sentenceIndex && m.wordIndex === word.wordIndex)
                          ),
                        };
                      }
                    }),
                  }
                : a
            ),
          }
        : w
    ),
  };
}

// ---- Review record operations ----

export function addReviewRecord(data: AppData, weekId: string, articleId: string, record: Omit<ReviewRecord, "id">): AppData {
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

export function deleteReviewRecord(data: AppData, weekId: string, articleId: string, recordId: string): AppData {
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
