// ============================================================
// SentenceCard - 1文ごとの表示コンポーネント
// Design: Editorial Brutalism
// - 英文は常に表示
// - 日本語訳はデフォルト折りたたみ
// - 語彙は日本語訳の直下にデフォルト折りたたみ
// - 語彙の追加・編集・削除
// - 熟語登録: 2単語マーク時に個別/熟語を選べるポップアップ
// - マーキング単語の長押しで意味ポップオーバー
// ============================================================

import { useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import type { Sentence, MarkedWord, VocabItem } from "@/lib/types";

// ---- MarkableWord with long-press popover ----

interface MarkableWordProps {
  token: string;
  sentenceIndex: number;
  wordIndex: number;
  marked: MarkedWord | undefined;
  vocabulary: VocabItem[];
  // 熟語選択モード
  phraseSelecting: boolean;
  phraseSelected: number[]; // 選択中のwordIndex配列
  onToggle: (word: MarkedWord) => void;
  onPhraseSelect: (wordIndex: number) => void;
}

function getNextMarkType(current: "unknown" | "unsure" | undefined): "unknown" | "unsure" | null {
  if (!current) return "unknown";
  if (current === "unknown") return "unsure";
  return null;
}

function MarkableWord({
  token, sentenceIndex, wordIndex, marked, vocabulary,
  phraseSelecting, phraseSelected, onToggle, onPhraseSelect
}: MarkableWordProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const vocab = vocabulary.find(
    (v) =>
      v.word.toLowerCase().replace(/[^a-z0-9]/g, "") === token.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      (token.length >= 4 && v.word.toLowerCase().startsWith(token.toLowerCase().slice(0, 4)))
  );

  const isPhrasePending = phraseSelecting && phraseSelected.includes(wordIndex);

  const handlePointerDown = useCallback(() => {
    if (phraseSelecting) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (marked) setPopoverOpen(true);
    }, 500);
  }, [marked, phraseSelecting]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleClick = useCallback(() => {
    if (phraseSelecting) {
      onPhraseSelect(wordIndex);
      return;
    }
    if (didLongPress.current) return;
    const next = getNextMarkType(marked?.markType);
    if (next === null) {
      onToggle({ word: token, markType: marked!.markType, sentenceIndex, wordIndex });
    } else {
      onToggle({ word: token, markType: next, sentenceIndex, wordIndex });
    }
  }, [phraseSelecting, marked, token, sentenceIndex, wordIndex, onToggle, onPhraseSelect]);

  let className = "";
  if (phraseSelecting) {
    className = isPhrasePending ? "word-phrase-pending" : "word-phrase-selectable";
  } else if (marked) {
    className = marked.markType === "unknown" ? "word-mark-unknown" : "word-mark-unsure";
  } else {
    className = "word-clickable";
  }

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

  if (!marked || phraseSelecting) return wordSpan;

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
    onSave({ ...vocab, word: word.trim(), definition: def.trim() });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex gap-1.5 items-center py-1">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="h-7 text-xs w-32 shrink-0"
          style={{ fontFamily: "var(--font-body)" }}
          placeholder="単語・熟語"
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
      <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: "8rem" }}>
        {vocab.isPhrase && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0" style={{ borderColor: "oklch(0.6 0.12 200)", color: "oklch(0.45 0.12 200)" }}>
            熟語
          </Badge>
        )}
        <span className="font-semibold" style={{ fontFamily: "var(--font-body)", color: "oklch(0.25 0.01 60)" }}>
          {vocab.word}
        </span>
      </div>
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
    onAdd({ word: word.trim(), definition: def.trim(), isPhrase: false });
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
        className="h-7 text-xs w-32 shrink-0"
        style={{ fontFamily: "var(--font-body)" }}
        placeholder="単語・熟語"
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

// ---- Phrase registration dialog (2単語選択後のモーダル) ----
interface PhraseDialogProps {
  words: string[]; // 選択された単語（順番通り）
  wordIndices: number[];
  sentenceIndex: number;
  onRegisterIndividual: () => void; // 個別に登録
  onRegisterPhrase: (phraseWord: string, definition: string) => void; // 熟語として登録
  onCancel: () => void;
}

function PhraseDialog({ words, wordIndices, sentenceIndex, onRegisterIndividual, onRegisterPhrase, onCancel }: PhraseDialogProps) {
  const [phraseWord, setPhraseWord] = useState(words.join(" "));
  const [definition, setDefinition] = useState("");

  return (
    <div
      className="mt-2 p-3 border rounded-sm"
      style={{ background: "oklch(0.97 0.005 200 / 0.6)", borderColor: "oklch(0.6 0.12 200)", fontFamily: "var(--font-ui)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={13} style={{ color: "oklch(0.45 0.12 200)" }} />
        <span className="text-xs font-semibold" style={{ color: "oklch(0.35 0.12 200)" }}>
          2つの単語が選択されました
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: "oklch(0.5 0.01 60)" }}>
        <span className="font-semibold" style={{ fontFamily: "var(--font-body)" }}>
          {words.join("  ")}
        </span>
        　をどのように登録しますか？
      </p>

      {/* 熟語として登録フォーム */}
      <div className="space-y-1.5 mb-3">
        <p className="text-xs font-medium" style={{ color: "oklch(0.45 0.12 200)" }}>熟語として登録</p>
        <div className="flex gap-1.5">
          <Input
            value={phraseWord}
            onChange={(e) => setPhraseWord(e.target.value)}
            className="h-7 text-xs w-36 shrink-0"
            style={{ fontFamily: "var(--font-body)" }}
            placeholder="熟語"
          />
          <Input
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className="h-7 text-xs flex-1"
            style={{ fontFamily: "var(--font-jp)" }}
            placeholder="意味（空欄可）"
            onKeyDown={(e) => e.key === "Enter" && onRegisterPhrase(phraseWord, definition)}
          />
          <Button
            size="sm"
            className="h-7 text-xs shrink-0"
            style={{ background: "oklch(0.45 0.12 200)", color: "white" }}
            onClick={() => onRegisterPhrase(phraseWord, definition)}
          >
            登録
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onRegisterIndividual}
        >
          個別に登録
        </Button>
        <button
          className="text-xs"
          style={{ color: "oklch(0.6 0.01 60)" }}
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
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

  // 熟語選択モード
  const [phraseSelecting, setPhraseSelecting] = useState(false);
  const [phraseSelected, setPhraseSelected] = useState<number[]>([]); // wordIndex配列
  const [showPhraseDialog, setShowPhraseDialog] = useState(false);

  const hasTranslation = !!sentence.japanese?.trim();

  // 熟語モードの単語選択ハンドラ
  const handlePhraseSelect = useCallback((wordIndex: number) => {
    setPhraseSelected((prev) => {
      if (prev.includes(wordIndex)) {
        return prev.filter((i) => i !== wordIndex);
      }
      const next = [...prev, wordIndex].sort((a, b) => a - b);
      if (next.length === 2) {
        setShowPhraseDialog(true);
      }
      return next;
    });
  }, []);

  // 熟語モードキャンセル
  const cancelPhraseMode = () => {
    setPhraseSelecting(false);
    setPhraseSelected([]);
    setShowPhraseDialog(false);
  };

  // 個別登録（2単語それぞれをVocabItemとして追加）
  const handleRegisterIndividual = () => {
    const tokens = splitIntoTokens(sentence.english);
    let wi = -1;
    const wordTokens: { token: string; wordIndex: number }[] = [];
    tokens.forEach((t) => {
      if (t.isWord) { wi++; wordTokens.push({ token: t.token, wordIndex: wi }); }
    });
    phraseSelected.forEach((idx) => {
      const found = wordTokens.find((w) => w.wordIndex === idx);
      if (found) {
        addVocabItem(weekId, articleId, sentenceIndex, {
          word: found.token,
          definition: "",
          isPhrase: false,
        });
      }
    });
    cancelPhraseMode();
    setVocabOpen(true);
  };

  // 熟語として登録
  const handleRegisterPhrase = (phraseWord: string, definition: string) => {
    addVocabItem(weekId, articleId, sentenceIndex, {
      word: phraseWord,
      definition,
      isPhrase: true,
      wordIndices: phraseSelected,
    });
    cancelPhraseMode();
    setVocabOpen(true);
  };

  // 選択中の単語テキストを取得
  const getSelectedWords = (): string[] => {
    const tokens = splitIntoTokens(sentence.english);
    let wi = -1;
    const result: string[] = [];
    tokens.forEach((t) => {
      if (t.isWord) {
        wi++;
        if (phraseSelected.includes(wi)) result.push(t.token);
      }
    });
    return result;
  };

  const tokens = splitIntoTokens(sentence.english);
  let wordIndex = -1;

  const vocabSection = (
    <div>
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
              phraseSelecting={phraseSelecting}
              phraseSelected={phraseSelected}
              onToggle={onToggleWord}
              onPhraseSelect={handlePhraseSelect}
            />
          );
        })}
      </p>

      {/* 熟語モードバー */}
      <div className="mt-1.5 flex items-center gap-2">
        {!phraseSelecting ? (
          <button
            className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.6 0.12 200)", fontFamily: "var(--font-ui)" }}
            onClick={() => { setPhraseSelecting(true); setPhraseSelected([]); setShowPhraseDialog(false); }}
          >
            <BookOpen size={11} /> 熟語登録
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-ui)" }}>
            <span style={{ color: "oklch(0.45 0.12 200)" }}>
              {phraseSelected.length === 0
                ? "1つ目の単語をクリック"
                : phraseSelected.length === 1
                ? "2つ目の単語をクリック"
                : "単語を選択中..."}
            </span>
            <button className="underline" style={{ color: "oklch(0.6 0.01 60)" }} onClick={cancelPhraseMode}>
              キャンセル
            </button>
          </div>
        )}
      </div>

      {/* 熟語選択ダイアログ */}
      {showPhraseDialog && phraseSelected.length === 2 && (
        <PhraseDialog
          words={getSelectedWords()}
          wordIndices={phraseSelected}
          sentenceIndex={sentenceIndex}
          onRegisterIndividual={handleRegisterIndividual}
          onRegisterPhrase={handleRegisterPhrase}
          onCancel={cancelPhraseMode}
        />
      )}

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
