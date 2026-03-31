// ============================================================
// The Economist Study App - アプリデータコンテキスト
// Structure: Week → Article → Sentence (段落レベルは廃止)
// ============================================================

// 冒頭をこのように書き換えてください
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AppData, Week, Article, Sentence, MarkedWord, ReviewRecord, VocabItem } from "@/lib/types";
import {
  fetchCloudData, // 変更
  saveCloudData,  // 変更
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
  deleteVocabItem,
  updateVocabItem,
  updateArticleNote,
  setWordCheck,
  addReviewRecord,
  deleteReviewRecord,
} from "@/lib/storage";

// （これ以降の interface AppContextValue { ... } はそのまま残します）
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
  deleteVocabItem: (weekId: string, articleId: string, sentenceIndex: number, vocabIndex: number) => void;
  updateVocabItem: (weekId: string, articleId: string, sentenceIndex: number, vocabIndex: number, item: VocabItem) => void;
  // Article note
  updateArticleNote: (weekId: string, articleId: string, note: string) => void;
  // Word checks (単語一覧チェック、マーキングとは独立)
  setWordCheck: (weekId: string, articleId: string, key: string, checked: boolean) => void;
  // Review records
  addReviewRecord: (weekId: string, articleId: string, record: Omit<ReviewRecord, "id">) => void;
  deleteReviewRecord: (weekId: string, articleId: string, recordId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 初期値は空のデータをセットし、ローディング状態を追加
  const [data, setData] = useState<AppData>({ weeks: [] });
  const [loading, setLoading] = useState(true);

  // ★ アプリ起動時に1回だけFirebaseからデータを取得する
  useEffect(() => {
    fetchCloudData().then((cloudData) => {
      setData(cloudData);
      setLoading(false); // 読み込み完了
    });
  }, []);

  // ★ データが更新されるたびにFirebaseに保存する
  const update = useCallback((newData: AppData) => {
    setData(newData);
    saveCloudData(newData);
  }, []);

  // ★ クラウドからの読み込み中画面
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
    addWeek: (label, issueDate) => update(addWeek(data, label, issueDate)),
    updateWeek: (weekId, patch) => update(updateWeek(data, weekId, patch)),
    deleteWeek: (weekId) => update(deleteWeek(data, weekId)),
    addArticle: (weekId, title) => update(addArticle(data, weekId, title)),
    updateArticle: (weekId, articleId, patch) => update(updateArticle(data, weekId, articleId, patch)),
    deleteArticle: (weekId, articleId) => update(deleteArticle(data, weekId, articleId)),
    setSentences: (weekId, articleId, sentences) => update(setSentences(data, weekId, articleId, sentences)),
    toggleMarkedWord: (weekId, articleId, word) => update(toggleMarkedWord(data, weekId, articleId, word)),
    addMarkedWords: (weekId, articleId, words) => update(addMarkedWords(data, weekId, articleId, words)),
    addVocabItem: (weekId, articleId, sentenceIndex, item) => update(addVocabItem(data, weekId, articleId, sentenceIndex, item)),
    deleteVocabItem: (weekId, articleId, sentenceIndex, vocabIndex) => update(deleteVocabItem(data, weekId, articleId, sentenceIndex, vocabIndex)),
    updateVocabItem: (weekId, articleId, sentenceIndex, vocabIndex, item) => update(updateVocabItem(data, weekId, articleId, sentenceIndex, vocabIndex, item)),
    updateArticleNote: (weekId, articleId, note) => update(updateArticleNote(data, weekId, articleId, note)),
    setWordCheck: (weekId, articleId, key, checked) => update(setWordCheck(data, weekId, articleId, key, checked)),
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
