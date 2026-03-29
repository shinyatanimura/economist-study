// ============================================================
// VocabTest - マーキング単語のフラッシュカードテスト
// Design: Editorial Brutalism
// - わからなかった・微妙の単語を対象
// - 英語→日本語の意味当てクイズ（フラッシュカード形式）
// - テスト結果はマーキング状態に一切影響しない
// ============================================================

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronRight, Check, X, Trophy, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Article, MarkedWord, Sentence } from "@/lib/types";

interface TestCard {
  word: string;
  definition: string;
  markType: "unknown" | "unsure";
  context: string; // 出典文（英文）
}

interface VocabTestProps {
  article: Article;
}

function buildCards(article: Article): TestCard[] {
  const cards: TestCard[] = [];
  for (const mw of article.markedWords) {
    const sentence: Sentence | undefined = article.sentences[mw.sentenceIndex];
    if (!sentence) continue;
    // 語彙リストから対応する定義を探す（大文字小文字無視）
    const vocab = sentence.vocabulary.find(
      (v) => v.word.toLowerCase().replace(/[^a-z0-9]/g, "") === mw.word.toLowerCase().replace(/[^a-z0-9]/g, "")
        || v.word.toLowerCase().startsWith(mw.word.toLowerCase().slice(0, 4))
    );
    if (!vocab) continue;
    cards.push({
      word: vocab.word,
      definition: vocab.definition,
      markType: mw.markType,
      context: sentence.english,
    });
  }
  // 重複除去（同じ単語が複数マークされている場合）
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = c.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type CardResult = "correct" | "incorrect" | null;

export default function VocabTest({ article }: VocabTestProps) {
  const allCards = useMemo(() => buildCards(article), [article]);
  const [deck, setDeck] = useState<TestCard[]>(() => shuffle(buildCards(article)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const current = deck[currentIndex];
  const total = deck.length;
  const correctCount = results.filter((r) => r === "correct").length;
  const incorrectCount = results.filter((r) => r === "incorrect").length;

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
    }
  };

  const handleResult = useCallback((result: "correct" | "incorrect") => {
    const newResults = [...results, result];
    setResults(newResults);
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
      setShowContext(false);
    }
  }, [results, currentIndex, total]);

  const handleRestart = (wrongOnly = false) => {
    const base = wrongOnly
      ? deck.filter((_, i) => results[i] === "incorrect")
      : allCards;
    setDeck(shuffle(base));
    setCurrentIndex(0);
    setFlipped(false);
    setResults([]);
    setFinished(false);
    setShowContext(false);
  };

  if (allCards.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-sm">
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-ui)" }}>
          テスト対象の単語がありません。
        </p>
        <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "var(--font-ui)" }}>
          英文の単語をクリックして「わからなかった」「微妙」にマークし、<br />
          かつその文に語彙が登録されている単語がテスト対象になります。
        </p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / total) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center py-8"
      >
        <div className="mb-6">
          <Trophy size={40} className="mx-auto mb-3" style={{ color: "oklch(0.42 0.18 25)" }} />
          <h2 className="font-display text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            テスト完了
          </h2>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-ui)" }}>
            {total}問中 {correctCount}問正解
          </p>
        </div>

        {/* Score ring */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(0.92 0.004 286.32)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={pct >= 70 ? "oklch(0.55 0.18 145)" : pct >= 40 ? "oklch(0.72 0.15 60)" : "oklch(0.55 0.22 25)"}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 40 * pct / 100} ${2 * Math.PI * 40}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold font-display" style={{ fontFamily: "var(--font-display)" }}>{pct}%</span>
          </div>
        </div>

        {/* Result breakdown */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "oklch(0.55 0.18 145)", fontFamily: "var(--font-display)" }}>{correctCount}</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-ui)" }}>正解</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "oklch(0.55 0.22 25)", fontFamily: "var(--font-display)" }}>{incorrectCount}</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-ui)" }}>不正解</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {incorrectCount > 0 && (
            <Button onClick={() => handleRestart(true)} className="gap-2">
              <RotateCcw size={14} /> 不正解のみ再テスト ({incorrectCount}問)
            </Button>
          )}
          <Button variant="outline" onClick={() => handleRestart(false)} className="gap-2">
            <Shuffle size={14} /> 全問シャッフルして再テスト
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-5" style={{ fontFamily: "var(--font-ui)" }}>
          ※ マーキング（わからなかった・微妙）は変更されていません
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ fontFamily: "var(--font-ui)" }}>
            {currentIndex + 1} / {total}
          </span>
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: current?.markType === "unknown" ? "var(--mark-unknown)" : "var(--mark-unsure)",
              color: current?.markType === "unknown" ? "var(--mark-unknown)" : "var(--mark-unsure)",
            }}
          >
            {current?.markType === "unknown" ? "わからなかった" : "微妙"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-ui)" }}>
          <span style={{ color: "oklch(0.55 0.18 145)" }}>✓ {correctCount}</span>
          <span style={{ color: "oklch(0.55 0.22 25)" }}>✗ {incorrectCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "oklch(0.42 0.18 25)" }}
          animate={{ width: `${((currentIndex) / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Flash card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          {/* Card face */}
          <div
            className="bg-card border border-border rounded-sm shadow-sm overflow-hidden cursor-pointer select-none"
            onClick={handleFlip}
            style={{ minHeight: "220px" }}
          >
            {/* Card header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between" style={{ background: "oklch(0.975 0.008 80)" }}>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>
                {flipped ? "意味" : "この単語の意味は？"}
              </span>
              {!flipped && (
                <span className="text-xs" style={{ color: "oklch(0.65 0.01 60)", fontFamily: "var(--font-ui)" }}>
                  クリックで答えを表示
                </span>
              )}
            </div>

            {/* Card body */}
            <div className="px-5 py-8 flex flex-col items-center justify-center text-center" style={{ minHeight: "160px" }}>
              {!flipped ? (
                <div>
                  <p className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-body)" }}>
                    {current?.word}
                  </p>
                  {showContext && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs mt-3 leading-relaxed max-w-sm"
                      style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-body)" }}
                    >
                      {current?.context}
                    </motion.p>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-sm mb-3" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-body)" }}>
                    {current?.word}
                  </p>
                  <p className="text-xl font-semibold leading-relaxed" style={{ fontFamily: "var(--font-jp)" }}>
                    {current?.definition}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Context toggle (before flip) */}
          {!flipped && (
            <div className="text-center mt-2">
              <button
                className="text-xs underline"
                style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}
                onClick={(e) => { e.stopPropagation(); setShowContext(!showContext); }}
              >
                {showContext ? "文脈を隠す" : "文脈を見る"}
              </button>
            </div>
          )}

          {/* Answer buttons (after flip) */}
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-3 mt-4"
            >
              <Button
                variant="outline"
                className="flex-1 gap-2 h-12 text-base border-2"
                style={{ borderColor: "oklch(0.55 0.22 25)", color: "oklch(0.55 0.22 25)" }}
                onClick={() => handleResult("incorrect")}
              >
                <X size={16} /> 不正解
              </Button>
              <Button
                className="flex-1 gap-2 h-12 text-base"
                style={{ background: "oklch(0.55 0.18 145)", color: "white" }}
                onClick={() => handleResult("correct")}
              >
                <Check size={16} /> 正解
              </Button>
            </motion.div>
          )}

          {/* Skip */}
          {!flipped && (
            <div className="text-center mt-3">
              <button
                className="text-xs flex items-center gap-1 mx-auto"
                style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}
                onClick={(e) => { e.stopPropagation(); handleResult("incorrect"); }}
              >
                スキップ <ChevronRight size={12} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Note */}
      <p className="text-xs text-center mt-6" style={{ color: "oklch(0.7 0.01 60)", fontFamily: "var(--font-ui)" }}>
        ※ テスト結果はマーキングに影響しません
      </p>
    </div>
  );
}
