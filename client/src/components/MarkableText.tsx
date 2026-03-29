// ============================================================
// MarkableText - 英文テキストの単語マーキングコンポーネント
// Design: Editorial Brutalism
// Click cycle: none → unknown(amber) → unsure(blue) → none
// ============================================================

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MarkedWord, WordMarkType } from "@/lib/types";

interface MarkableTextProps {
  text: string;
  sentenceIndex: number;
  markedWords: MarkedWord[];
  onToggle: (word: MarkedWord) => void;
  readOnly?: boolean;
}

function splitIntoTokens(text: string): { token: string; isWord: boolean }[] {
  // Split into words and non-word characters (spaces, punctuation)
  const parts = text.split(/(\s+|[^\w''-]+)/);
  return parts
    .filter((p) => p.length > 0)
    .map((token) => ({
      token,
      isWord: /[\w''-]+/.test(token) && token.trim().length > 0,
    }));
}

function getMarkLabel(markType: WordMarkType): string {
  return markType === "unknown" ? "わからなかった" : "微妙";
}

function getNextMarkType(current: WordMarkType | undefined): WordMarkType | null {
  if (!current) return "unknown";
  if (current === "unknown") return "unsure";
  return null; // remove mark
}

export default function MarkableText({ text, sentenceIndex, markedWords, onToggle, readOnly }: MarkableTextProps) {
  const tokens = splitIntoTokens(text);
  let wordIndex = -1;

  return (
    <span>
      {tokens.map((item, i) => {
        if (!item.isWord) {
          return <span key={i}>{item.token}</span>;
        }

        wordIndex++;
        const currentWordIndex = wordIndex;
        const marked = markedWords.find(
          (m) => m.sentenceIndex === sentenceIndex && m.wordIndex === currentWordIndex
        );

        const handleClick = () => {
          if (readOnly) return;
          const next = getNextMarkType(marked?.markType);
          if (next === null) {
            // Remove: pass current mark to toggle (will remove it)
            onToggle({
              word: item.token,
              markType: marked!.markType,
              sentenceIndex,
              wordIndex: currentWordIndex,
            });
          } else {
            onToggle({
              word: item.token,
              markType: next,
              sentenceIndex,
              wordIndex: currentWordIndex,
            });
          }
        };

        const className = marked
          ? marked.markType === "unknown"
            ? "word-mark-unknown"
            : "word-mark-unsure"
          : readOnly
          ? ""
          : "word-clickable";

        const wordEl = (
          <span
            key={i}
            className={className}
            onClick={handleClick}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {item.token}
          </span>
        );

        if (marked) {
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                {wordEl}
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <span
                  className="font-semibold"
                  style={{ color: marked.markType === "unknown" ? "var(--mark-unknown)" : "var(--mark-unsure)" }}
                >
                  {getMarkLabel(marked.markType)}
                </span>
                {!readOnly && <span className="ml-1 text-muted-foreground">（クリックで変更）</span>}
              </TooltipContent>
            </Tooltip>
          );
        }

        return wordEl;
      })}
    </span>
  );
}
