// ============================================================
// ArticleView - 記事詳細表示コンポーネント
// Design: Editorial Brutalism
// Structure: Article → Sentence[] (段落レベルなし)
// ============================================================

import { useState } from "react";
import { Plus, BookOpen, RotateCcw, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SentenceCard from "./SentenceCard";
import ReviewSection from "./ReviewSection";
import WordList from "./WordList";
import { useApp } from "@/contexts/AppContext";
import type { Article, Week, Sentence, VocabItem } from "@/lib/types";

function formatIssueDateFull(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  } catch {
    return isoDate;
  }
}

// ---- Parser ----
// Geminiからコピペされた形式を解析
// 英文 → （日本語訳） → word: 意味 の繰り返し
function parseArticleInput(raw: string): Sentence[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const sentences: Sentence[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 英文の開始を検出（大文字始まりまたはALL CAPS）
    if (/^[A-Z""]/.test(line) && !line.includes("：") && !line.startsWith("（")) {
      const english = line;
      let japanese = "";
      const vocabulary: VocabItem[] = [];
      i++;

      // 次の行が日本語訳か確認（（）で囲まれているか、日本語文字を含む）
      if (i < lines.length && (lines[i].startsWith("（") || /[ぁ-んァ-ン一-龥]/.test(lines[i]))) {
        japanese = lines[i].replace(/^（|）$/g, "").trim();
        i++;
      }

      // 続く語彙行を収集（「word：意味」または「word: 意味」形式）
      while (i < lines.length) {
        const vocabLine = lines[i];
        // 次の英文が来たら終了
        if (/^[A-Z""]/.test(vocabLine) && !vocabLine.includes("：") && !vocabLine.includes(":")) break;
        // 語彙行の判定
        const colonJa = vocabLine.indexOf("：");
        const colonEn = vocabLine.indexOf(": ");
        if (colonJa > 0) {
          vocabulary.push({ word: vocabLine.slice(0, colonJa).trim(), definition: vocabLine.slice(colonJa + 1).trim() });
          i++;
        } else if (colonEn > 0) {
          vocabulary.push({ word: vocabLine.slice(0, colonEn).trim(), definition: vocabLine.slice(colonEn + 2).trim() });
          i++;
        } else {
          break;
        }
      }

      sentences.push({ english, japanese, vocabulary });
    } else {
      i++;
    }
  }

  return sentences;
}

interface ArticleViewProps {
  week: Week;
  article: Article;
}

export default function ArticleView({ week, article }: ArticleViewProps) {
  const { setSentences, updateArticle, toggleMarkedWord, updateArticleNote } = useApp();
  const [noteValue, setNoteValue] = useState(article.note ?? "");
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveNote = () => {
    updateArticleNote(week.id, article.id, noteValue);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  // Add/Edit sentences dialog
  const [inputOpen, setInputOpen] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(article.title);

  const handleSaveInput = () => {
    const parsed = parseArticleInput(rawInput);
    if (parsed.length === 0) {
      toast.error("文が認識できませんでした。形式を確認してください。");
      return;
    }
    setSentences(week.id, article.id, [...article.sentences, ...parsed]);
    setRawInput("");
    setInputOpen(false);
    toast.success(`${parsed.length}文を追加しました`);
  };

  const handleClearSentences = () => {
    setSentences(week.id, article.id, []);
    toast.success("本文をクリアしました");
  };

  const handleSaveTitle = () => {
    updateArticle(week.id, article.id, { title: titleValue.trim() || article.title });
    setEditingTitle(false);
  };

  const unknownCount = article.markedWords.filter((w) => w.markType === "unknown").length;
  const unsureCount = article.markedWords.filter((w) => w.markType === "unsure").length;

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Article header */}
        <div className="mb-8">
          <hr className="economist-rule mb-4" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.42 0.18 25)", fontFamily: "var(--font-ui)" }}>
                  {week.label}
                </p>
                {week.issueDate && (
                  <p className="text-xs" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>
                    {formatIssueDateFull(week.issueDate)}
                  </p>
                )}
              </div>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 text-2xl font-bold border-b-2 border-primary bg-transparent outline-none"
                    style={{ fontFamily: "var(--font-display)" }}
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}><Check size={14} /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTitle(false)}><X size={14} /></Button>
                </div>
              ) : (
                <div className="flex items-start gap-2 group">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {article.title}
                  </h1>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 rounded hover:bg-muted"
                    onClick={() => { setTitleValue(article.title); setEditingTitle(true); }}
                  >
                    <Pencil size={13} style={{ color: "oklch(0.55 0.01 60)" }} />
                  </button>
                </div>
              )}
            </div>
            <BookOpen size={24} className="shrink-0 mt-1" style={{ color: "oklch(0.42 0.18 25)" }} />
          </div>

          {/* Mark stats */}
          {(unknownCount > 0 || unsureCount > 0) && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {unknownCount > 0 && (
                <span className="text-xs px-2 py-1 rounded-sm" style={{ background: "var(--mark-unknown-bg)", color: "var(--mark-unknown)", fontFamily: "var(--font-ui)" }}>
                  わからなかった: {unknownCount}語
                </span>
              )}
              {unsureCount > 0 && (
                <span className="text-xs px-2 py-1 rounded-sm" style={{ background: "var(--mark-unsure-bg)", color: "var(--mark-unsure)", fontFamily: "var(--font-ui)" }}>
                  微妙: {unsureCount}語
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="article">
          <TabsList className="mb-6">
            <TabsTrigger value="article">記事本文</TabsTrigger>
            <TabsTrigger value="wordlist" className="gap-1.5">
              単語一覧
              {article.markedWords.length > 0 && (
                <span className="ml-1 text-xs rounded-full px-1.5 py-0.5" style={{ background: "oklch(0.42 0.18 25)", color: "white" }}>
                  {article.markedWords.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="memo" className="gap-1.5">
              メモ
              {(article.note ?? "").trim().length > 0 && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full inline-block" style={{ background: "oklch(0.42 0.18 25)" }} />
              )}
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1.5">
              <RotateCcw size={13} />
              復習チェック
              {article.reviewRecords.length > 0 && (
                <span className="ml-1 text-xs rounded-full px-1.5 py-0.5" style={{ background: "oklch(0.42 0.18 25)", color: "white" }}>
                  {article.reviewRecords.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Article tab */}
          <TabsContent value="article">
            {article.sentences.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-sm">
                <p className="text-muted-foreground mb-4 text-sm" style={{ fontFamily: "var(--font-ui)" }}>
                  本文がまだありません
                </p>
                <Button onClick={() => setInputOpen(true)} className="gap-2">
                  <Plus size={14} /> 本文を貼り付け
                </Button>
              </div>
            ) : (
              <div>
                {/* Sentences */}
                <div className="bg-card border border-border rounded-sm px-5 py-2 mb-4">
                  {article.sentences.map((s, i) => (
                    <SentenceCard
                      key={i}
                      sentence={s}
                      sentenceIndex={i}
                      weekId={week.id}
                      articleId={article.id}
                      markedWords={article.markedWords}
                      onToggleWord={(word) => toggleMarkedWord(week.id, article.id, word)}
                    />
                  ))}
                </div>

                {/* Mark legend */}
                <p className="text-xs mb-4" style={{ color: "oklch(0.65 0.01 60)", fontFamily: "var(--font-ui)" }}>
                  英単語をクリック：
                  <span className="mx-1 px-1 rounded-sm text-xs" style={{ background: "var(--mark-unknown-bg)", borderBottom: "2px solid var(--mark-unknown)", color: "var(--mark-unknown)" }}>わからなかった</span>
                  →
                  <span className="mx-1 px-1 rounded-sm text-xs" style={{ background: "var(--mark-unsure-bg)", borderBottom: "2px solid var(--mark-unsure)", color: "var(--mark-unsure)" }}>微妙</span>
                  → 解除
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setInputOpen(true)} className="gap-1.5">
                    <Plus size={13} /> 文を追加
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={handleClearSentences}
                  >
                    <Trash2 size={13} /> 本文をクリア
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Memo tab */}
          <TabsContent value="memo">
            <div className="max-w-xl">
              <p className="text-xs mb-2" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>
                この記事についてのメモを自由に記録できます。
              </p>
              <Textarea
                value={noteValue}
                onChange={(e) => { setNoteValue(e.target.value); setNoteSaved(false); }}
                placeholder="気づいたこと、背景知識、感想など..."
                className="min-h-[200px] text-sm leading-relaxed resize-y"
                style={{ fontFamily: "var(--font-jp)" }}
              />
              <div className="flex items-center gap-3 mt-3">
                <Button size="sm" onClick={handleSaveNote} className="gap-1.5">
                  <Check size={13} /> 保存
                </Button>
                {noteSaved && (
                  <span className="text-xs" style={{ color: "oklch(0.55 0.18 145)", fontFamily: "var(--font-ui)" }}>
                    保存しました
                  </span>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Word list tab */}
          <TabsContent value="wordlist">
            <WordList article={article} weekId={week.id} />
          </TabsContent>

          {/* Review tab */}
          <TabsContent value="review">
            <ReviewSection week={week} article={article} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Input Dialog */}
      <Dialog open={inputOpen} onOpenChange={setInputOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">本文を貼り付け</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-ui)" }}>
              以下の形式で貼り付けてください（Geminiからのコピペに対応）：
            </p>
            <div className="text-xs rounded-sm p-3 border border-border" style={{ background: "oklch(0.97 0.005 80)", fontFamily: "var(--font-body)", color: "oklch(0.4 0.01 60)", lineHeight: 1.8 }}>
              EVEN BY HIS chaotic standards, Donald Trump has just...<br />
              （トランプ大統領自身の混乱した基準に照らしても...）<br />
              chaotic：混乱した<br />
              preside over：～を主宰する<br />
              <br />
              THE NEXT SENTENCE starts here...<br />
              （次の文の日本語訳）
            </div>
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="ここに貼り付けてください..."
              className="min-h-[240px] text-sm"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInputOpen(false)}>キャンセル</Button>
            <Button onClick={handleSaveInput} disabled={!rawInput.trim()}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
