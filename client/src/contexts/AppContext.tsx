// ============================================================
// The Economist Study App - アプリデータコンテキスト
// Structure: Week → Article → Sentence (段落レベルは廃止)
// ============================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AppData, Week, Article, Sentence, MarkedWord, ReviewRecord, VocabItem } from "@/lib/types";
import {
  fetchCloudData,
  saveCloudData,
  addWeek,
  updateWeek,
  deleteWeek,
  addArticle,
  updateArticle,
  deleteArticle,
  setSentences,
  toggleMarkedWord,
  addMarkedWords,
  addVocabItem,
  addVocabItems, // 🌟 ここに複数形を追加するのを忘れずに！
  deleteVocabItem,
  updateVocabItem,
  updateArticleNote,
  setWordCheck,
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
  addMarkedWords: (weekId: string, articleId: string, words: MarkedWord[]) => void;
  // Vocabulary
  addVocabItem: (weekId: string, articleId: string, sentenceIndex: number, item: VocabItem) => void;
  addVocabItems: (weekId: string, articleId: string, sentenceIndex: number, items: VocabItem[]) => void; // 🌟 複数形を追加
  deleteVocabItem: (weekId: string, articleId: string, sentenceIndex: number, vocabIndex: number) => void;
  updateVocabItem: (weekId: string, articleId: string, sentenceIndex: number, vocabIndex: number, item: VocabItem) => void;
  // Article note
  updateArticleNote: (weekId: string, articleId: string, note: string) => void;
  // Word checks
  setWordCheck: (weekId: string, articleId: string, key: string, checked: boolean) => void;
  // Review records
  addReviewRecord: (weekId: string, articleId: string, record: Omit<ReviewRecord, "id">) => void;
  deleteReviewRecord: (weekId: string, articleId: string, recordId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ weeks: [] });
  const [loading, setLoading] = useState(true);

  // ★ アプリ起動時にデータを取得
  useEffect(() => {
    fetchCloudData().then((cloudData) => {
      setData(cloudData);
      setLoading(false);
    });
  }, []);

  // 🌟 update関数：最新の状態を参照して、Firebaseに保存する（1つに集約）
  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      saveCloudData(next);
      return next;
    });
  }, []);

  // ★ 読み込み中画面
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-ui)" }}>
          クラウドと同期中...
        </p>
      </div>
    );
  }

  const value: AppContextValue = {
    data,
    addWeek: (label, issueDate) => update((prev) => addWeek(prev, label, issueDate)),
    updateWeek: (weekId, patch) => update((prev) => updateWeek(prev, weekId, patch)),
    deleteWeek: (weekId) => update((prev) => deleteWeek(prev, weekId)),
    addArticle: (weekId, title) => update((prev) => addArticle(prev, weekId, title)),
    updateArticle: (weekId, articleId, patch) => update((prev) => updateArticle(prev, weekId, articleId, patch)),
    deleteArticle: (weekId, articleId) => update((prev) => deleteArticle(prev, weekId, articleId)),
    setSentences: (weekId, articleId, sentences) => update((prev) => setSentences(prev, weekId, articleId, sentences)),
    toggleMarkedWord: (weekId, articleId, word) => update((prev) => toggleMarkedWord(prev, weekId, articleId, word)),
    addMarkedWords: (weekId, articleId, words) => update((prev) => addMarkedWords(prev, weekId, articleId, words)),
    addVocabItem: (weekId, articleId, sentenceIndex, item) => update((prev) => addVocabItem(prev, weekId, articleId, sentenceIndex, item)),
    addVocabItems: (weekId, articleId, sentenceIndex, items) => update((prev) => addVocabItems(prev, weekId, articleId, sentenceIndex, items)),
    deleteVocabItem: (weekId, articleId, sentenceIndex, vocabIndex) => update((prev) => deleteVocabItem(prev, weekId, articleId, sentenceIndex, vocabIndex)),
    updateVocabItem: (weekId, articleId, sentenceIndex, vocabIndex, item) => update((prev) => updateVocabItem(prev, weekId, articleId, sentenceIndex, vocabIndex, item)),
    updateArticleNote: (weekId, articleId, note) => update((prev) => updateArticleNote(prev, weekId, articleId, note)),
    setWordCheck: (weekId, articleId, key, checked) => update((prev) => setWordCheck(prev, weekId, articleId, key, checked)),
    addReviewRecord: (weekId, articleId, record) => update((prev) => addReviewRecord(prev, weekId, articleId, record)),
    deleteReviewRecord: (weekId, articleId, recordId) => update((prev) => deleteReviewRecord(prev, weekId, articleId, recordId)),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
