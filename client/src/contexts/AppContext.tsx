// ============================================================
// The Economist Study App - アプリデータコンテキスト
// Design: Editorial Brutalism
// ============================================================

import React, { createContext, useContext, useState, useCallback } from "react";
import type { AppData, MarkedWord, ReviewRecord } from "@/lib/types";
import {
  loadData,
  saveData,
  addWeek,
  updateWeek,
  deleteWeek,
  addArticle,
  updateArticle,
  deleteArticle,
  addParagraph,
  updateParagraph,
  deleteParagraph,
  toggleMarkedWord,
  addReviewRecord,
  deleteReviewRecord,
} from "@/lib/storage";
import type { Paragraph } from "@/lib/types";

interface AppContextValue {
  data: AppData;
  // Week
  addWeek: (label: string, issueDate: string) => void;
  updateWeek: (weekId: string, patch: Partial<Pick<import("@/lib/types").Week, "label" | "issueDate">>) => void;
  deleteWeek: (weekId: string) => void;
  // Article
  addArticle: (weekId: string, title: string) => void;
  updateArticle: (weekId: string, articleId: string, patch: Partial<Pick<import("@/lib/types").Article, "title">>) => void;
  deleteArticle: (weekId: string, articleId: string) => void;
  // Paragraph
  addParagraph: (weekId: string, articleId: string, paragraph: Omit<Paragraph, "id" | "markedWords">) => void;
  updateParagraph: (weekId: string, articleId: string, paragraphId: string, patch: Partial<Paragraph>) => void;
  deleteParagraph: (weekId: string, articleId: string, paragraphId: string) => void;
  // Marked words
  toggleMarkedWord: (weekId: string, articleId: string, paragraphId: string, word: MarkedWord) => void;
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
    addParagraph: (weekId, articleId, paragraph) => update(addParagraph(data, weekId, articleId, paragraph)),
    updateParagraph: (weekId, articleId, paragraphId, patch) => update(updateParagraph(data, weekId, articleId, paragraphId, patch)),
    deleteParagraph: (weekId, articleId, paragraphId) => update(deleteParagraph(data, weekId, articleId, paragraphId)),
    toggleMarkedWord: (weekId, articleId, paragraphId, word) => update(toggleMarkedWord(data, weekId, articleId, paragraphId, word)),
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
