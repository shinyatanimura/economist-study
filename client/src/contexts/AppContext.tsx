// ============================================================
// The Economist Study App - アプリデータコンテキスト
// Structure: Week → Article → Sentence (段落レベルは廃止)
// ============================================================

import React, { createContext, useContext, useState, useCallback } from "react";
import type { AppData, Week, Article, Sentence, MarkedWord, ReviewRecord } from "@/lib/types";
import {
  loadData,
  saveData,
  addWeek,
  updateWeek,
  deleteWeek,
  addArticle,
  updateArticle,
  deleteArticle,
  setSentences,
  toggleMarkedWord,
  addReviewRecord,
  deleteReviewRecord,
} from "@/lib/storage";

interface AppContextValue {
  data: AppData;
  // Week
  addWeek: (label: string, issueDate: string) => void;
  updateWeek: (weekId: string, patch: Partial<Pick<Week, "label" | "issueDate">>) => void;
  deleteWeek: (weekId: string) => void;
  // Article
  addArticle: (weekId: string, title: string) => void;
  updateArticle: (weekId: string, articleId: string, patch: Partial<Pick<Article, "title" | "sentences" | "markedWords">>) => void;
  deleteArticle: (weekId: string, articleId: string) => void;
  // Sentences
  setSentences: (weekId: string, articleId: string, sentences: Sentence[]) => void;
  // Marked words
  toggleMarkedWord: (weekId: string, articleId: string, word: MarkedWord) => void;
  // Review records
  addReviewRecord: (weekId: string, articleId: string, record: Omit<ReviewRecord, "id">) => void;
  deleteReviewRecord: (weekId: string, articleId: string, recordId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  const update = useCallback((newData: AppData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const value: AppContextValue = {
    data,
    addWeek: (label, issueDate) => update(addWeek(data, label, issueDate)),
    updateWeek: (weekId, patch) => update(updateWeek(data, weekId, patch)),
    deleteWeek: (weekId) => update(deleteWeek(data, weekId)),
    addArticle: (weekId, title) => update(addArticle(data, weekId, title)),
    updateArticle: (weekId, articleId, patch) => update(updateArticle(data, weekId, articleId, patch)),
    deleteArticle: (weekId, articleId) => update(deleteArticle(data, weekId, articleId)),
    setSentences: (weekId, articleId, sentences) => update(setSentences(data, weekId, articleId, sentences)),
    toggleMarkedWord: (weekId, articleId, word) => update(toggleMarkedWord(data, weekId, articleId, word)),
    addReviewRecord: (weekId, articleId, record) => update(addReviewRecord(data, weekId, articleId, record)),
    deleteReviewRecord: (weekId, articleId, recordId) => update(deleteReviewRecord(data, weekId, articleId, recordId)),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
