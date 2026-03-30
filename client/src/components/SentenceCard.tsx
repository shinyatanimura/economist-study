// ============================================================
// SentenceCard - 1文ごとの表示コンポーネント
// Design: Editorial Brutalism
//
// 熟語登録フロー（再設計）:
//   1. 「熟語登録」ボタンで選択モード開始
//   2. 単語を何語でもクリックして選択（再クリックで解除）
//   3. 「登録する」ボタンで確認ダイアログを表示
//   4. ダイアログで：
//      - 熟語テキスト（編集可）
//      - 意味（入力可）
//      - マーキング（わからなかった / 微妙 / なし）を選択
//      - 「熟語として登録」または「個別に登録」
// ============================================================

import { useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import type { Sentence, MarkedWord, VocabItem, WordMarkType } from "@/lib/types";

// ---- Token splitter ----
function splitIntoTokens(text: string): { token: string; isWord: boolean }[] {
  const parts = text.split(/(\s+|[^\w''-]+)/);
  return parts
    .filter((p) => p.length > 0)
    .map((token) => ({ token, isWord: /[\w''-]+/.test(token) && token.trim().length > 0 }));
}

// ---- MarkableWord ----
interface MarkableWordProps {
  token: string;
  sentenceIndex: number;
  wordIndex: number;
  marked: MarkedWord | undefined;
  vocabulary: VocabItem[];
  phraseSelecting: boolean;
  phraseSelected: number[];
  onToggle: (word: MarkedWord) => void;
  onPhraseSelect: (wordIndex: number) => void;
}

function MarkableWord({
  token, sentenceIndex, wordIndex, marked, vocabulary,
  phraseSelecting, phraseSelected, onToggle, onPhraseSelect,
}: MarkableWordProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  // 長押しで意味ポップオーバー（通常モードのみ）
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
    // 通常モード: なし→わからなかった→微妙→なし
    if (!marked) {
      onToggle({ word: token, markType: "unknown", sentenceIndex, wordIndex });
    } else if (marked.markType === "unknown") {
      onToggle({ word: token, markType: "unsure", sentenceIndex, wordIndex });
    } else {
      onToggle({ word: token, markType: marked.markType, sentenceIndex, wordIndex });
    }
  }, [phraseSelecting, marked, token, sentenceIndex, wordIndex, onToggle, onPhraseSelect]);

  const isPhrasePending = phraseSelecting && phraseSelected.includes(wordIndex);

  let className = "";
  if (phraseSelecting) {
    className = isPhrasePending ? "word-phrase-pending" : "word-phrase-selectable";
  } else if (marked) {
    className = marked.markType === "unknown" ? "word-mark-unknown" : "word-mark-unsure";
  } else {
    className = "word-clickable";
  }

  // 長押しポップオーバー用の意味検索
  const vocab = vocabulary.find(
    (v) => v.word.toLowerCase().replace(/[^a-z0-9]/g, "") === token.toLowerCase().replace(/[^a-z0-9]/g, "")
      || (token.length >= 4 && v.word.toLowerCase().startsWith(token.toLowerCase().slice(0, 4)))
  );

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

  // 熟語モード中または未マークはポップオーバーなし
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
            <p className="text-xs" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>語彙未登録</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
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
        <Input value={word} onChange={(e) => setWord(e.target.value)} className="h-7 text-xs w-32 shrink-0" style={{ fontFamily: "var(--font-body)" }} placeholder="単語・熟語" />
        <Input value={def} onChange={(e) => setDef(e.target.value)} className="h-7 text-xs flex-1" style={{ fontFamily: "var(--font-jp)" }} placeholder="意味" onKeyDown={(e) => e.key === "Enter" && handleSave()} />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSave}><Check size={12} /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(false)}><X size={12} /></Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-sm items-center group py-0.5">
      <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: "8rem" }}>
        {vocab.isPhrase && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0" style={{ borderColor: "oklch(0.6 0.12 200)", color: "oklch(0.45 0.12 200)" }}>熟語</Badge>
        )}
        <span className="font-semibold" style={{ fontFamily: "var(--font-body)", color: "oklch(0.25 0.01 60)" }}>{vocab.word}</span>
      </div>
      <span className="flex-1" style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>{vocab.definition}</span>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted" onClick={() => { setWord(vocab.word); setDef(vocab.definition); setEditing(true); }}>
        <Pencil size={11} style={{ color: "oklch(0.55 0.01 60)" }} />
      </button>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted" onClick={onDelete}>
        <Trash2 size={11} style={{ color: "oklch(0.55 0.22 25)" }} />
      </button>
    </div>
  );
}

// ---- Add vocab row ----
function AddVocabRow({ onAdd }: { onAdd: (item: VocabItem) => void }) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [def, setDef] = useState("");

  const handleAdd = () => {
    if (!word.trim()) return;
    onAdd({ word: word.trim(), definition: def.trim(), isPhrase: false });
    setWord(""); setDef(""); setOpen(false);
  };

  if (!open) {
    return (
      <button className="flex items-center gap-1 text-xs mt-1 hover:opacity-80 transition-opacity" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }} onClick={() => setOpen(true)}>
        <Plus size={11} /> 語彙を追加
      </button>
    );
  }

  return (
    <div className="flex gap-1.5 items-center mt-1">
      <Input value={word} onChange={(e) => setWord(e.target.value)} className="h-7 text-xs w-32 shrink-0" style={{ fontFamily: "var(--font-body)" }} placeholder="単語・熟語" autoFocus />
      <Input value={def} onChange={(e) => setDef(e.target.value)} className="h-7 text-xs flex-1" style={{ fontFamily: "var(--font-jp)" }} placeholder="意味（空欄可）" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleAdd}><Check size={12} /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setOpen(false)}><X size={12} /></Button>
    </div>
  );
}

// ---- Phrase confirm dialog ----
// 単語を選択後「登録する」を押したときに表示
interface PhraseConfirmDialogProps {
  selectedWords: string[];       // 選択された単語テキスト（順番通り）
  selectedIndices: number[];     // wordIndex配列
  sentenceIndex: number;
  onRegisterPhrase: (phraseWord: string, definition: string, markType: WordMarkType | null) => void;
  onRegisterIndividual: (markType: WordMarkType | null) => void;
  onCancel: () => void;
}

function PhraseConfirmDialog({
  selectedWords, selectedIndices, sentenceIndex,
  onRegisterPhrase, onRegisterIndividual, onCancel,
}: PhraseConfirmDialogProps) {
  const [phraseText, setPhraseText] = useState(selectedWords.join(" "));
  const [definition, setDefinition] = useState("");
  const [markType, setMarkType] = useState<WordMarkType | null>(null);

  const markOptions: { value: WordMarkType | null; label: string; style: React.CSSProperties }[] = [
    { value: null, label: "マークなし", style: { background: "oklch(0.93 0.005 80)", color: "oklch(0.45 0.01 60)" } },
    { value: "unknown", label: "わからなかった", style: { background: "var(--mark-unknown-bg)", color: "var(--mark-unknown)" } },
    { value: "unsure", label: "微妙", style: { background: "var(--mark-unsure-bg)", color: "var(--mark-unsure)" } },
  ];

  return (
    <div
      className="mt-2 p-3 border rounded-sm space-y-3"
      style={{ background: "oklch(0.97 0.005 200 / 0.6)", borderColor: "oklch(0.6 0.12 200)", fontFamily: "var(--font-ui)" }}
    >
      <div className="flex items-center gap-2">
        <BookOpen size={13} style={{ color: "oklch(0.45 0.12 200)" }} />
        <span className="text-xs font-semibold" style={{ color: "oklch(0.35 0.12 200)" }}>
          {selectedWords.length}語を選択中：
          <span className="ml-1 font-bold" style={{ fontFamily: "var(--font-body)" }}>
            {selectedWords.join("  ")}
          </span>
        </span>
      </div>

      {/* マーキング選択 */}
      <div>
        <p className="text-xs mb-1.5" style={{ color: "oklch(0.5 0.01 60)" }}>マーキング</p>
        <div className="flex gap-1.5 flex-wrap">
          {markOptions.map((opt) => (
            <button
              key={String(opt.value)}
              className="text-xs px-2 py-1 rounded-sm font-semibold transition-all"
              style={{
                ...opt.style,
                outline: markType === opt.value ? "2px solid oklch(0.45 0.12 200)" : "none",
                outlineOffset: "1px",
              }}
              onClick={() => setMarkType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 熟語として登録 */}
      <div>
        <p className="text-xs mb-1.5" style={{ color: "oklch(0.45 0.12 200)", fontWeight: 600 }}>熟語として登録</p>
        <div className="flex gap-1.5">
          <Input
            value={phraseText}
            onChange={(e) => setPhraseText(e.target.value)}
            className="h-7 text-xs w-36 shrink-0"
            style={{ fontFamily: "var(--font-body)" }}
            placeholder="熟語テキスト"
          />
          <Input
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className="h-7 text-xs flex-1"
            style={{ fontFamily: "var(--font-jp)" }}
            placeholder="意味（空欄可）"
            onKeyDown={(e) => e.key === "Enter" && onRegisterPhrase(phraseText, definition, markType)}
          />
          <Button
            size="sm"
            className="h-7 text-xs shrink-0"
            style={{ background: "oklch(0.45 0.12 200)", color: "white" }}
            onClick={() => onRegisterPhrase(phraseText, definition, markType)}
          >
            登録
          </Button>
        </div>
      </div>

      {/* 個別登録 or キャンセル */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onRegisterIndividual(markType)}
        >
          個別に登録
        </Button>
        <button
          className="text-xs underline"
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
  const [phraseSelected, setPhraseSelected] = useState<number[]>([]);
  const [showPhraseDialog, setShowPhraseDialog] = useState(false);

  const hasTranslation = !!sentence.japanese?.trim();

  // トークン→wordIndex マッピング（レンダリング時に構築）
  const tokens = splitIntoTokens(sentence.english);
  const wordTokenMap: { token: string; wordIndex: number }[] = [];
  let wi = -1;
  tokens.forEach((t) => {
    if (t.isWord) { wi++; wordTokenMap.push({ token: t.token, wordIndex: wi }); }
  });

  // 熟語モードの単語選択（何語でも選択可能、再クリックで解除）
  const handlePhraseSelect = useCallback((wordIndex: number) => {
    setPhraseSelected((prev) => {
      if (prev.includes(wordIndex)) {
        return prev.filter((i) => i !== wordIndex);
      }
      return [...prev, wordIndex].sort((a, b) => a - b);
    });
  }, []);

  // 熟語モードキャンセル
  const cancelPhraseMode = () => {
    setPhraseSelecting(false);
    setPhraseSelected([]);
    setShowPhraseDialog(false);
  };

  // 選択中の単語テキストを取得（wordIndex順）
  const getSelectedWords = (): string[] => {
    return phraseSelected
      .map((idx) => wordTokenMap.find((w) => w.wordIndex === idx)?.token ?? "")
      .filter(Boolean);
  };

  // 熟語として登録（マーキングも同時に設定）
  const handleRegisterPhrase = (phraseText: string, definition: string, markType: WordMarkType | null) => {
    // 語彙に熟語を追加
    addVocabItem(weekId, articleId, sentenceIndex, {
      word: phraseText.trim() || getSelectedWords().join(" "),
      definition,
      isPhrase: true,
      wordIndices: phraseSelected,
    });
    // マーキングを設定（各単語に同じmarkTypeを付与）
    if (markType) {
      phraseSelected.forEach((idx) => {
        const found = wordTokenMap.find((w) => w.wordIndex === idx);
        if (!found) return;
        const existing = markedWords.find(
          (m) => m.sentenceIndex === sentenceIndex && m.wordIndex === idx
        );
        // 既にそのmarkTypeなら何もしない、なければ追加
        if (!existing || existing.markType !== markType) {
          onToggleWord({ word: found.token, markType, sentenceIndex, wordIndex: idx });
        }
      });
    }
    cancelPhraseMode();
    setVocabOpen(true);
  };

  // 個別に登録（各単語を別々のVocabItemとして追加、マーキングも設定）
  const handleRegisterIndividual = (markType: WordMarkType | null) => {
    phraseSelected.forEach((idx) => {
      const found = wordTokenMap.find((w) => w.wordIndex === idx);
      if (!found) return;
      addVocabItem(weekId, articleId, sentenceIndex, {
        word: found.token,
        definition: "",
        isPhrase: false,
      });
      if (markType) {
        const existing = markedWords.find(
          (m) => m.sentenceIndex === sentenceIndex && m.wordIndex === idx
        );
        if (!existing || existing.markType !== markType) {
          onToggleWord({ word: found.token, markType, sentenceIndex, wordIndex: idx });
        }
      }
    });
    cancelPhraseMode();
    setVocabOpen(true);
  };

  // 語彙セクション
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
            <AddVocabRow onAdd={(item) => addVocabItem(weekId, articleId, sentenceIndex, item)} />
          </div>
        )}
      </div>
    </div>
  );

  // レンダリング
  let renderWordIndex = -1;

  return (
    <div className="border-b border-border last:border-b-0 py-3">
      {/* English sentence */}
      <p className="text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
        {tokens.map((item, i) => {
          if (!item.isWord) return <span key={i}>{item.token}</span>;
          renderWordIndex++;
          const currentWordIndex = renderWordIndex;
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
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        {!phraseSelecting ? (
          <button
            className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.6 0.12 200)", fontFamily: "var(--font-ui)" }}
            onClick={() => { setPhraseSelecting(true); setPhraseSelected([]); setShowPhraseDialog(false); }}
          >
            <BookOpen size={11} /> 熟語登録
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ fontFamily: "var(--font-ui)" }}>
            <span style={{ color: "oklch(0.45 0.12 200)" }}>
              {phraseSelected.length === 0
                ? "単語をクリックして選択（何語でも可）"
                : `${phraseSelected.length}語選択中 — さらに追加するか「登録する」を押してください`}
            </span>
            {phraseSelected.length >= 1 && !showPhraseDialog && (
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                style={{ background: "oklch(0.45 0.12 200)", color: "white" }}
                onClick={() => setShowPhraseDialog(true)}
              >
                登録する
              </Button>
            )}
            <button className="text-xs underline" style={{ color: "oklch(0.6 0.01 60)" }} onClick={cancelPhraseMode}>
              キャンセル
            </button>
          </div>
        )}
      </div>

      {/* 熟語確認ダイアログ */}
      {showPhraseDialog && phraseSelected.length >= 1 && (
        <PhraseConfirmDialog
          selectedWords={getSelectedWords()}
          selectedIndices={phraseSelected}
          sentenceIndex={sentenceIndex}
          onRegisterPhrase={handleRegisterPhrase}
          onRegisterIndividual={handleRegisterIndividual}
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
        <div className="mt-1.5">{vocabSection}</div>
      )}
    </div>
  );
}
