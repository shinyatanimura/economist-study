// ============================================================
// WordList - マーキング単語の一覧コンポーネント
// Design: Editorial Brutalism
// - マーキング済み単語を sentenceIndex 順に一覧表示
// - 熟語として登録された単語群は1行にまとめて表示
// - チェックをつけると灰色になり一覧の下部へ移動
// - チェック状態はマーキング（わからなかった/微妙）に影響しない
// ============================================================

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import type { Article } from "@/lib/types";

// 🌟 英文から熟語のインデックスを自動で探し出す関数（原形・過去形なども柔軟にマッチ）
function getWordIndicesForPhrase(sentenceText: string, phraseText: string): number[] {
  const wordRegex = /[\w''-]+/;
  const tokens = sentenceText.split(/(\s+|[^\w''-]+)/).filter(p => p.length > 0);
  let currentWordIndex = -1;
  const wordTokens: { word: string; index: number }[] = [];

  tokens.forEach((t) => {
    if (wordRegex.test(t) && t.trim().length > 0) {
      currentWordIndex++;
      wordTokens.push({ word: t, index: currentWordIndex });
    }
  });

  const pTokens = phraseText.split(/(\s+|[^\w''-]+)/).filter(p => wordRegex.test(p) && p.trim().length > 0);
  if (pTokens.length === 0) return [];

  // パターン1: 連続してマッチするかチェック
  for (let i = 0; i <= wordTokens.length - pTokens.length; i++) {
    let matchCount = 0;
    for (let j = 0; j < pTokens.length; j++) {
      const w1 = wordTokens[i + j].word.toLowerCase().replace(/[^a-z0-9]/g, "");
      const w2 = pTokens[j].toLowerCase().replace(/[^a-z0-9]/g, "");
      
      const isMatch = w1 === w2 || w1.includes(w2) || w2.includes(w1) || (w1.length >= 3 && w2.length >= 3 && w1.slice(0, 3) === w2.slice(0, 3));

      if (isMatch) matchCount++;
      else break;
    }
    if (matchCount === pTokens.length) {
      return wordTokens.slice(i, i + pTokens.length).map(w => w.index);
    }
  }

  // パターン2: 間に別の単語が挟まっていても順番に出現すればマッチとみなす
  let phraseWordIndex = 0;
  const fallbackIndices: number[] = [];
  for (let i = 0; i < wordTokens.length; i++) {
    const w1 = wordTokens[i].word.toLowerCase().replace(/[^a-z0-9]/g, "");
    const w2 = pTokens[phraseWordIndex].toLowerCase().replace(/[^a-z0-9]/g, "");
    const isMatch = w1 === w2 || w1.includes(w2) || w2.includes(w1) || (w1.length >= 3 && w2.length >= 3 && w1.slice(0, 3) === w2.slice(0, 3));

    if (isMatch) {
      fallbackIndices.push(wordTokens[i].index);
      phraseWordIndex++;
      if (phraseWordIndex === pTokens.length) return fallbackIndices;
    }
  }

  return [];
}

interface WordEntry {
  key: string;
  displayWord: string;
  markType: "unknown" | "unsure";
  sentenceIndex: number;
  sortWordIndex: number;
  definition: string;
  isPhrase: boolean;
  context: string;
  checked: boolean;
  memberWordIndices: number[];
}

export default function WordList({
  article,
  weekId,
}: {
  article: Article;
  weekId: string;
}) {
  const { setWordCheck } = useApp();
  const wordChecks = article.wordChecks ?? {};

  const entries: WordEntry[] = useMemo(() => {
    const phraseVocabBySentence: Map<number, { word: string; definition: string; wordIndices: number[] }[]> = new Map();
    
    article.sentences.forEach((s, si) => {
      // 🌟絶対的修正ポイント：「isPhraseがtrue」または「名前にスペースが含まれている」なら強制的に熟語にする！
      const phrases = (s.vocabulary ?? []).filter((v) => v.isPhrase || v.word.includes(" "));
      
      if (phrases.length > 0) {
        phraseVocabBySentence.set(si, phrases.map((v) => {
          let indices = v.wordIndices ?? [];
          if (indices.length === 0) {
            indices = getWordIndicesForPhrase(s.english ?? "", v.word);
          }
          return {
            word: v.word,
            definition: v.definition ?? "",
            wordIndices: indices,
          };
        }));
      }
    });

    const markedSet = new Map<string, "unknown" | "unsure">();
    for (const mw of article.markedWords) {
      markedSet.set(`${mw.sentenceIndex}-${mw.wordIndex}`, mw.markType);
    }

    const absorbed = new Set<string>();
    const result: WordEntry[] = [];

    const sentenceIndices = Array.from(new Set(article.markedWords.map((m) => m.sentenceIndex))).sort((a, b) => a - b);

    for (const si of sentenceIndices) {
      const sentence = article.sentences[si];
      const context = sentence?.english ?? "";
      const phrases = phraseVocabBySentence.get(si) ?? [];

      const sentenceMarked = article.markedWords
        .filter((m) => m.sentenceIndex === si)
        .sort((a, b) => a.wordIndex - b.wordIndex);

      // 熟語の処理
      for (const phrase of phrases) {
        const { wordIndices } = phrase;
        const markedIndices = wordIndices.filter((wi) => markedSet.has(`${si}-${wi}`));
        
        if (markedIndices.length === 0) continue;

        const markType: "unknown" | "unsure" = markedIndices.some(
          (wi) => markedSet.get(`${si}-${wi}`) === "unknown"
        ) ? "unknown" : "unsure";

        const phraseKey = `phrase-${si}-${wordIndices.join("-")}`;
        const checked = wordChecks[phraseKey] ?? false;

        result.push({
          key: phraseKey,
          displayWord: phrase.word,
          markType,
          sentenceIndex: si,
          sortWordIndex: Math.min(...wordIndices),
          definition: phrase.definition,
          isPhrase: true,
          context,
          checked,
          memberWordIndices: wordIndices,
        });

        wordIndices.forEach((wi) => absorbed.add(`${si}-${wi}`));
      }

      // 個別単語の処理
      for (const mw of sentenceMarked) {
        const mwKey = `${mw.sentenceIndex}-${mw.wordIndex}`;
        if (absorbed.has(mwKey)) continue;

        if (result.some((e) => e.key === mwKey)) continue;

        const vocab = sentence?.vocabulary ?? [];
        const v = vocab.find(
          (v) =>
            !(v.isPhrase || v.word.includes(" ")) && // 🌟ここも修正（強制的に熟語化されたものは省く）
            (v.word.toLowerCase().replace(/[^a-z0-9]/g, "") ===
              mw.word.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              (mw.word.length >= 4 &&
                v.word.toLowerCase().startsWith(mw.word.toLowerCase().slice(0, 4))))
        );

        result.push({
          key: mwKey,
          displayWord: mw.word,
          markType: mw.markType,
          sentenceIndex: si,
          sortWordIndex: mw.wordIndex,
          definition: v?.definition ?? "",
          isPhrase: false,
          context,
          checked: wordChecks[mwKey] ?? false,
          memberWordIndices: [mw.wordIndex],
        });
      }
    }

    result.sort((a, b) =>
      a.sentenceIndex !== b.sentenceIndex
        ? a.sentenceIndex - b.sentenceIndex
        : a.sortWordIndex - b.sortWordIndex
    );

    return result;
  }, [article.markedWords, article.sentences, article.wordChecks]);

  const unchecked = entries.filter((e) => !e.checked);
  const checked = entries.filter((e) => e.checked);
  const ordered = [...unchecked, ...checked];

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-sm">
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-ui)" }}>
          マーキングされた単語がありません。
        </p>
        <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "var(--font-ui)" }}>
          英文の単語をクリックして「わからなかった」「微妙」にマークすると
          <br />
          ここに一覧表示されます。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>
          {unchecked.length}件 未確認 / {checked.length}件 確認済み
        </p>
        {checked.length > 0 && (
          <button
            className="text-xs underline"
            style={{ color: "oklch(0.65 0.01 60)", fontFamily: "var(--font-ui)" }}
            onClick={() => {
              checked.forEach((e) => setWordCheck(weekId, article.id, e.key, false));
            }}
          >
            確認済みをリセット
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <AnimatePresence initial={false}>
          {ordered.map((entry) => (
            <motion.div
              key={entry.key}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0"
              style={{
                opacity: entry.checked ? 0.45 : 1,
                background: entry.checked ? "oklch(0.97 0 0)" : undefined,
              }}
            >
              <button
                className="mt-0.5 shrink-0 transition-opacity hover:opacity-70"
                onClick={() => setWordCheck(weekId, article.id, entry.key, !entry.checked)}
                title={entry.checked ? "未確認に戻す" : "確認済みにする"}
              >
                {entry.checked ? (
                  <CheckSquare size={16} style={{ color: "oklch(0.55 0.18 145)" }} />
                ) : (
                  <Square size={16} style={{ color: "oklch(0.7 0.01 60)" }} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="font-semibold text-base"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: entry.checked ? "oklch(0.6 0.01 60)" : "oklch(0.2 0.01 60)",
                      textDecoration: entry.checked ? "line-through" : "none",
                    }}
                  >
                    {entry.displayWord}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4"
                    style={{
                      borderColor: entry.markType === "unknown" ? "var(--mark-unknown)" : "var(--mark-unsure)",
                      color: entry.markType === "unknown" ? "var(--mark-unknown)" : "var(--mark-unsure)",
                    }}
                  >
                    {entry.markType === "unknown" ? "わからなかった" : "微妙"}
                  </Badge>
                  {entry.isPhrase && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4"
                      style={{ borderColor: "oklch(0.6 0.12 200)", color: "oklch(0.45 0.12 200)" }}
                    >
                      熟語
                    </Badge>
                  )}
                </div>

                {entry.definition && (
                  <p
                    className="text-sm mt-0.5"
                    style={{
                      fontFamily: "var(--font-jp)",
                      color: entry.checked ? "oklch(0.65 0.01 60)" : "oklch(0.4 0.01 60)",
                    }}
                  >
                    {entry.definition}
                  </p>
                )}

                {entry.context && (
                  <p
                    className="text-xs mt-1 leading-relaxed line-clamp-2"
                    style={{ color: "oklch(0.65 0.01 60)", fontFamily: "var(--font-body)" }}
                  >
                    {entry.context}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p
        className="text-xs text-center mt-4"
        style={{ color: "oklch(0.7 0.01 60)", fontFamily: "var(--font-ui)" }}
      >
        ※ チェック状態はマーキング（わからなかった・微妙）に影響しません
      </p>
    </div>
  );
}
