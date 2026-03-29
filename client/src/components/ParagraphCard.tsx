// ============================================================
// ParagraphCard - 段落の表示・編集コンポーネント
// Design: Editorial Brutalism
// ============================================================

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MarkableText from "./MarkableText";
import type { Paragraph, MarkedWord, Sentence, VocabItem } from "@/lib/types";

interface ParagraphCardProps {
  paragraph: Paragraph;
  index: number;
  weekId: string;
  articleId: string;
  onUpdate: (patch: Partial<Paragraph>) => void;
  onDelete: () => void;
  onToggleWord: (word: MarkedWord) => void;
}

export default function ParagraphCard({
  paragraph,
  index,
  onUpdate,
  onDelete,
  onToggleWord,
}: ParagraphCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState(paragraph.title);
  const [editSentences, setEditSentences] = useState<Sentence[]>(paragraph.sentences);
  const [editVocab, setEditVocab] = useState<VocabItem[]>(paragraph.vocabulary);

  const unknownCount = paragraph.markedWords.filter((w) => w.markType === "unknown").length;
  const unsureCount = paragraph.markedWords.filter((w) => w.markType === "unsure").length;

  const startEdit = () => {
    setEditTitle(paragraph.title);
    setEditSentences([...paragraph.sentences]);
    setEditVocab([...paragraph.vocabulary]);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = () => {
    onUpdate({
      title: editTitle,
      sentences: editSentences,
      vocabulary: editVocab,
    });
    setEditing(false);
  };

  const addSentence = () => {
    setEditSentences([...editSentences, { english: "", japanese: "" }]);
  };

  const removeSentence = (i: number) => {
    setEditSentences(editSentences.filter((_, idx) => idx !== i));
  };

  const updateSentence = (i: number, field: keyof Sentence, value: string) => {
    setEditSentences(editSentences.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addVocab = () => {
    setEditVocab([...editVocab, { word: "", definition: "" }]);
  };

  const removeVocab = (i: number) => {
    setEditVocab(editVocab.filter((_, idx) => idx !== i));
  };

  const updateVocab = (i: number, field: keyof VocabItem, value: string) => {
    setEditVocab(editVocab.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  };

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-4 px-5 py-4 border-b border-border">
        <span className="para-number select-none" style={{ color: "oklch(0.88 0.005 80)", minWidth: "2.5rem" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {paragraph.title || "（タイトルなし）"}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>
              {paragraph.sentences.length}文
            </span>
            {unknownCount > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: "var(--mark-unknown)", color: "var(--mark-unknown)" }}>
                わからなかった {unknownCount}
              </Badge>
            )}
            {unsureCount > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: "var(--mark-unsure)", color: "var(--mark-unsure)" }}>
                微妙 {unsureCount}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} title="編集">
                <Pencil size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} title="削除">
                <Trash2 size={13} />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="px-5 py-4">
          {editing ? (
            /* Edit mode */
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.01 60)" }}>段落タイトル</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="段落の見出し（日本語）"
                />
              </div>

              {/* Sentences */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.01 60)" }}>文・対訳</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addSentence}>
                    <Plus size={11} /> 文を追加
                  </Button>
                </div>
                {editSentences.map((s, i) => (
                  <div key={i} className="border border-border rounded-sm p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>文 {i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeSentence(i)}>
                        <X size={12} />
                      </Button>
                    </div>
                    <Textarea
                      value={s.english}
                      onChange={(e) => updateSentence(i, "english", e.target.value)}
                      placeholder="English sentence..."
                      className="text-sm resize-none min-h-[60px]"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                    <Textarea
                      value={s.japanese}
                      onChange={(e) => updateSentence(i, "japanese", e.target.value)}
                      placeholder="日本語訳..."
                      className="text-sm resize-none min-h-[50px]"
                      style={{ fontFamily: "var(--font-jp)" }}
                    />
                  </div>
                ))}
              </div>

              {/* Vocabulary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.01 60)" }}>語彙リスト</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addVocab}>
                    <Plus size={11} /> 語彙を追加
                  </Button>
                </div>
                {editVocab.map((v, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      value={v.word}
                      onChange={(e) => updateVocab(i, "word", e.target.value)}
                      placeholder="単語・フレーズ"
                      className="w-40 shrink-0 text-sm"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                    <Input
                      value={v.definition}
                      onChange={(e) => updateVocab(i, "definition", e.target.value)}
                      placeholder="意味・解説"
                      className="flex-1 text-sm"
                      style={{ fontFamily: "var(--font-jp)" }}
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeVocab(i)}>
                      <X size={13} />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Save/Cancel */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveEdit} className="gap-1">
                  <Check size={13} /> 保存
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-5">
              {/* Sentences */}
              {paragraph.sentences.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">文がありません。編集ボタンから追加してください。</p>
              ) : (
                <div className="space-y-4">
                  {paragraph.sentences.map((s, i) => (
                    <div key={i} className="space-y-1.5">
                      {/* English with markable words */}
                      <p className="text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                        <MarkableText
                          text={s.english}
                          sentenceIndex={i}
                          markedWords={paragraph.markedWords}
                          onToggle={onToggleWord}
                        />
                      </p>
                      {/* Japanese translation */}
                      {s.japanese && (
                        <p className="text-sm leading-relaxed pl-3 border-l-2" style={{ color: "oklch(0.45 0.01 60)", borderColor: "oklch(0.88 0.005 80)", fontFamily: "var(--font-jp)" }}>
                          {s.japanese}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Vocabulary */}
              {paragraph.vocabulary.length > 0 && (
                <div>
                  <hr className="economist-rule mb-3" />
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>
                    Vocabulary
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {paragraph.vocabulary.map((v, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="font-semibold shrink-0" style={{ fontFamily: "var(--font-body)", color: "oklch(0.25 0.01 60)", minWidth: "8rem" }}>
                          {v.word}
                        </span>
                        <span style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>
                          {v.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mark legend hint */}
              {paragraph.sentences.length > 0 && (
                <p className="text-xs" style={{ color: "oklch(0.65 0.01 60)", fontFamily: "var(--font-ui)" }}>
                  英単語をクリック：
                  <span className="mx-1 px-1 rounded-sm text-xs" style={{ background: "var(--mark-unknown-bg)", borderBottom: "2px solid var(--mark-unknown)", color: "var(--mark-unknown)" }}>わからなかった</span>
                  →
                  <span className="mx-1 px-1 rounded-sm text-xs" style={{ background: "var(--mark-unsure-bg)", borderBottom: "2px solid var(--mark-unsure)", color: "var(--mark-unsure)" }}>微妙</span>
                  → 解除
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
