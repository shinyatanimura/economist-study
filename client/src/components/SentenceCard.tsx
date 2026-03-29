// ============================================================
// SentenceCard - 1文ごとの表示コンポーネント
// Design: Editorial Brutalism
// - 英文は常に表示
// - 日本語訳はデフォルト折りたたみ
// - 語彙は日本語訳の直下にデフォルト折りたたみ
// ============================================================

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import MarkableText from "./MarkableText";
import type { Sentence, MarkedWord } from "@/lib/types";

interface SentenceCardProps {
  sentence: Sentence;
  sentenceIndex: number;
  markedWords: MarkedWord[];
  onToggleWord: (word: MarkedWord) => void;
}

export default function SentenceCard({ sentence, sentenceIndex, markedWords, onToggleWord }: SentenceCardProps) {
  const [translationOpen, setTranslationOpen] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);

  const hasTranslation = !!sentence.japanese?.trim();
  const hasVocab = sentence.vocabulary && sentence.vocabulary.length > 0;

  return (
    <div className="border-b border-border last:border-b-0 py-3">
      {/* English sentence */}
      <p className="text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
        <MarkableText
          text={sentence.english}
          sentenceIndex={sentenceIndex}
          markedWords={markedWords}
          onToggle={onToggleWord}
        />
      </p>

      {/* Japanese translation toggle */}
      {hasTranslation && (
        <div className="mt-1.5">
          <button
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}
            onClick={() => {
              setTranslationOpen(!translationOpen);
              if (!translationOpen) setVocabOpen(false); // 訳を閉じたら語彙も閉じる
            }}
          >
            {translationOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            日本語訳
          </button>

          {translationOpen && (
            <div className="mt-1.5 pl-3 border-l-2" style={{ borderColor: "oklch(0.88 0.005 80)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>
                {sentence.japanese}
              </p>

              {/* Vocabulary toggle (直下に配置) */}
              {hasVocab && (
                <div className="mt-2">
                  <button
                    className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                    style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}
                    onClick={() => setVocabOpen(!vocabOpen)}
                  >
                    {vocabOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    語彙 ({sentence.vocabulary.length})
                  </button>

                  {vocabOpen && (
                    <div className="mt-1.5 space-y-1">
                      {sentence.vocabulary.map((v, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span
                            className="font-semibold shrink-0"
                            style={{ fontFamily: "var(--font-body)", color: "oklch(0.25 0.01 60)", minWidth: "7rem" }}
                          >
                            {v.word}
                          </span>
                          <span style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>
                            {v.definition}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vocab only (no translation) */}
      {!hasTranslation && hasVocab && (
        <div className="mt-1.5">
          <button
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}
            onClick={() => setVocabOpen(!vocabOpen)}
          >
            {vocabOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            語彙 ({sentence.vocabulary.length})
          </button>

          {vocabOpen && (
            <div className="mt-1.5 pl-3 border-l-2 space-y-1" style={{ borderColor: "oklch(0.88 0.005 80)" }}>
              {sentence.vocabulary.map((v, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span
                    className="font-semibold shrink-0"
                    style={{ fontFamily: "var(--font-body)", color: "oklch(0.25 0.01 60)", minWidth: "7rem" }}
                  >
                    {v.word}
                  </span>
                  <span style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>
                    {v.definition}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
