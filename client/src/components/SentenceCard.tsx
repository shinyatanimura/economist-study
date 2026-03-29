// ============================================================
// SentenceCard - 1文ごとの表示コンポーネント
// Design: Editorial Brutalism
// - 英文は常に表示
// - 日本語訳はデフォルト折りたたみ
// - 語彙は日本語訳の直下にデフォルト折りたたみ
// - 語彙の追加・編集・削除
// - マーキング単語の長押しで意味ポップオーバー
// ============================================================

import { useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/contexts/AppContext";
import type { Sentence, MarkedWord, VocabItem } from "@/lib/types";

// ---- MarkableText with long-press popover ----

interface MarkableWordProps {
  token: string;
  sentenceIndex: number;
  wordIndex: number;
  marked: MarkedWord | undefined;
  vocabulary: VocabItem[];
  onToggle: (word: MarkedWord) => void;
}

function getNextMarkType(current: "unknown" | "unsure" | undefined): "unknown" | "unsure" | null {
  if (!current) return "unknown";
  if (current === "unknown") return "unsure";
  return null;
}

function MarkableWord({ token, sentenceIndex, wordIndex, marked, vocabulary, onToggle }: MarkableWordProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  // 対応する語彙を探す（部分一致）
  const vocab = vocabulary.find(
    (v) =>
      v.word.toLowerCase().replace(/[^a-z0-9]/g, "") === token.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      v.word.toLowerCase().startsWith(token.toLowerCase().slice(0, 4))
  );

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (marked) setPopoverOpen(true);
    }, 500);
  }, [marked]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleClick = useCallback(() => {
    if (didLongPress.current) return; // 長押しはクリックとして扱わない
    const next = getNextMarkType(marked?.markType);
    if (next === null) {
      onToggle({ word: token, markType: marked!.markType, sentenceIndex, wordIndex });
    } else {
      onToggle({ word: token, markType: next, sentenceIndex, wordIndex });
    }
  }, [marked, token, sentenceIndex, wordIndex, onToggle]);

  const className = marked
    ? marked.markType === "unknown"
      ? "word-mark-unknown"
      : "word-mark-unsure"
    : "word-clickable";

  const wordSpan = (
    <span
      className={className}
      style={{ fontFamily: "var(--font-body)", userSelect: "none", WebkitUserSelect: "none" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
    >
      {token}
    </span>
  );

  if (!marked) return wordSpan;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{wordSpan}</PopoverTrigger>
      <PopoverContent side="top" className="w-64 p-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-sm"
              style={{
                background: marked.markType === "unknown" ? "var(--mark-unknown-bg)" : "var(--mark-unsure-bg)",
                color: marked.markType === "unknown" ? "var(--mark-unknown)" : "var(--mark-unsure)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {marked.markType === "unknown" ? "わからなかった" : "微妙"}
            </span>
            <span className="font-semibold" style={{ fontFamily: "var(--font-body)" }}>{token}</span>
          </div>
          {vocab ? (
            <p style={{ color: "oklch(0.35 0.01 60)", fontFamily: "var(--font-jp)" }}>{vocab.definition}</p>
          ) : (
            <p className="text-xs" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>
              語彙未登録
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---- Token splitter ----
function splitIntoTokens(text: string): { token: string; isWord: boolean }[] {
  const parts = text.split(/(\s+|[^\w''-]+)/);
  return parts
    .filter((p) => p.length > 0)
    .map((token) => ({ token, isWord: /[\w''-]+/.test(token) && token.trim().length > 0 }));
}

// ---- Inline vocab editor row ----
interface VocabRowProps {
  vocab: VocabItem;
  onSave: (item: VocabItem) => void;
  onDelete: () => void;
}

function VocabRow({ vocab, onSave, onDelete }: VocabRowProps) {
  const [editing, setEditing] = useState(false);
  const [word, setWord] = useState(vocab.word);
  const [def, setDef] = useState(vocab.definition);

  const handleSave = () => {
    if (!word.trim()) return;
    onSave({ word: word.trim(), definition: def.trim() });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex gap-1.5 items-center py-1">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="h-7 text-xs w-28 shrink-0"
          style={{ fontFamily: "var(--font-body)" }}
          placeholder="単語"
        />
        <Input
          value={def}
          onChange={(e) => setDef(e.target.value)}
          className="h-7 text-xs flex-1"
          style={{ fontFamily: "var(--font-jp)" }}
          placeholder="意味"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSave}><Check size={12} /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(false)}><X size={12} /></Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-sm items-center group py-0.5">
      <span className="font-semibold shrink-0" style={{ fontFamily: "var(--font-body)", color: "oklch(0.25 0.01 60)", minWidth: "7rem" }}>
        {vocab.word}
      </span>
      <span className="flex-1" style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>
        {vocab.definition}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
        onClick={() => { setWord(vocab.word); setDef(vocab.definition); setEditing(true); }}
      >
        <Pencil size={11} style={{ color: "oklch(0.55 0.01 60)" }} />
      </button>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
        onClick={onDelete}
      >
        <Trash2 size={11} style={{ color: "oklch(0.55 0.22 25)" }} />
      </button>
    </div>
  );
}

// ---- Add vocab row ----
interface AddVocabRowProps {
  onAdd: (item: VocabItem) => void;
}

function AddVocabRow({ onAdd }: AddVocabRowProps) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [def, setDef] = useState("");

  const handleAdd = () => {
    if (!word.trim()) return;
    onAdd({ word: word.trim(), definition: def.trim() });
    setWord("");
    setDef("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        className="flex items-center gap-1 text-xs mt-1 hover:opacity-80 transition-opacity"
        style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}
        onClick={() => setOpen(true)}
      >
        <Plus size={11} /> 語彙を追加
      </button>
    );
  }

  return (
    <div className="flex gap-1.5 items-center mt-1">
      <Input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        className="h-7 text-xs w-28 shrink-0"
        style={{ fontFamily: "var(--font-body)" }}
        placeholder="単語"
        autoFocus
      />
      <Input
        value={def}
        onChange={(e) => setDef(e.target.value)}
        className="h-7 text-xs flex-1"
        style={{ fontFamily: "var(--font-jp)" }}
        placeholder="意味（空欄可）"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleAdd}><Check size={12} /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setOpen(false)}><X size={12} /></Button>
    </div>
  );
}

// ---- Main SentenceCard ----

interface SentenceCardProps {
  sentence: Sentence;
  sentenceIndex: number;
  weekId: string;
  articleId: string;
  markedWords: MarkedWord[];
  onToggleWord: (word: MarkedWord) => void;
}

export default function SentenceCard({
  sentence,
  sentenceIndex,
  weekId,
  articleId,
  markedWords,
  onToggleWord,
}: SentenceCardProps) {
  const { addVocabItem, deleteVocabItem, updateVocabItem } = useApp();
  const [translationOpen, setTranslationOpen] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);

  const hasTranslation = !!sentence.japanese?.trim();
  const hasVocab = sentence.vocabulary && sentence.vocabulary.length > 0;

  const tokens = splitIntoTokens(sentence.english);
  let wordIndex = -1;

  const vocabSection = (
    <div>
      {(hasVocab || true) && (
        <div className="mt-2">
          <button
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}
            onClick={() => setVocabOpen(!vocabOpen)}
          >
            {vocabOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            語彙 {sentence.vocabulary.length > 0 ? `(${sentence.vocabulary.length})` : ""}
          </button>

          {vocabOpen && (
            <div className="mt-1.5 space-y-0.5">
              {sentence.vocabulary.map((v, i) => (
                <VocabRow
                  key={i}
                  vocab={v}
                  onSave={(item) => updateVocabItem(weekId, articleId, sentenceIndex, i, item)}
                  onDelete={() => deleteVocabItem(weekId, articleId, sentenceIndex, i)}
                />
              ))}
              <AddVocabRow
                onAdd={(item) => addVocabItem(weekId, articleId, sentenceIndex, item)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="border-b border-border last:border-b-0 py-3">
      {/* English sentence with markable words */}
      <p className="text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
        {tokens.map((item, i) => {
          if (!item.isWord) return <span key={i}>{item.token}</span>;
          wordIndex++;
          const currentWordIndex = wordIndex;
          const marked = markedWords.find(
            (m) => m.sentenceIndex === sentenceIndex && m.wordIndex === currentWordIndex
          );
          return (
            <MarkableWord
              key={i}
              token={item.token}
              sentenceIndex={sentenceIndex}
              wordIndex={currentWordIndex}
              marked={marked}
              vocabulary={sentence.vocabulary}
              onToggle={onToggleWord}
            />
          );
        })}
      </p>

      {/* Japanese translation toggle */}
      {hasTranslation && (
        <div className="mt-1.5">
          <button
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}
            onClick={() => {
              setTranslationOpen(!translationOpen);
              if (translationOpen) setVocabOpen(false);
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
              {vocabSection}
            </div>
          )}
        </div>
      )}

      {/* Vocab only (no translation) */}
      {!hasTranslation && (
        <div className="mt-1.5">
          {vocabSection}
        </div>
      )}
    </div>
  );
}
