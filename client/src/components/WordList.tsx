// ============================================================
// WordList - マーキング単語の一覧コンポーネント
// Design: Editorial Brutalism
// - マーキング済み単語を sentenceIndex 順に一覧表示
// - チェックをつけると灰色になり一覧の下部へ移動
// - チェック状態はマーキング（わからなかった/微妙）に影響しない
// ============================================================

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import type { Article, VocabItem } from "@/lib/types";

interface WordEntry {
  key: string; // `${sentenceIndex}-${wordIndex}`
  word: string;
  markType: "unknown" | "unsure";
  sentenceIndex: number;
  wordIndex: number;
  definition: string;
  isPhrase: boolean;
  context: string;
  checked: boolean;
}

function findDefinition(word: string, vocab: VocabItem[]): { definition: string; isPhrase: boolean } {
  const v = vocab.find(
    (v) =>
      v.word.toLowerCase().replace(/[^a-z0-9]/g, "") === word.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      (word.length >= 4 && v.word.toLowerCase().startsWith(word.toLowerCase().slice(0, 4)))
  );
  return { definition: v?.definition ?? "", isPhrase: v?.isPhrase ?? false };
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
    const seen = new Set<string>();
    const result: WordEntry[] = [];

    for (const mw of article.markedWords) {
      const key = `${mw.sentenceIndex}-${mw.wordIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const sentence = article.sentences[mw.sentenceIndex];
      const context = sentence?.english ?? "";
      const vocab = sentence?.vocabulary ?? [];
      const { definition, isPhrase } = findDefinition(mw.word, vocab);

      result.push({
        key,
        word: mw.word,
        markType: mw.markType,
        sentenceIndex: mw.sentenceIndex,
        wordIndex: mw.wordIndex,
        definition,
        isPhrase,
        context,
        checked: wordChecks[key] ?? false,
      });
    }

    // sentenceIndex → wordIndex 順にソート
    result.sort((a, b) =>
      a.sentenceIndex !== b.sentenceIndex
        ? a.sentenceIndex - b.sentenceIndex
        : a.wordIndex - b.wordIndex
    );

    return result;
  }, [article.markedWords, article.sentences, article.wordChecks]);

  // チェック済みは下部へ
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
              {/* Check button */}
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

              {/* Word info */}
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
                    {entry.word}
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
