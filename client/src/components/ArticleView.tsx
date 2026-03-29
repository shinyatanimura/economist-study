// ============================================================
// ArticleView - 記事詳細表示コンポーネント
// Design: Editorial Brutalism
// ============================================================

import { useState } from "react";
import { Plus, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ParagraphCard from "./ParagraphCard";
import ReviewSection from "./ReviewSection";
import { useApp } from "@/contexts/AppContext";
import type { Article, Week, Paragraph, Sentence, VocabItem } from "@/lib/types";

interface ArticleViewProps {
  week: Week;
  article: Article;
}

// ---- Paragraph input parser ----
// Parses the user's pasted format into structured data
function parseParagraphInput(raw: string): { sentences: Sentence[]; vocabulary: VocabItem[] } {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const sentences: Sentence[] = [];
  const vocabulary: VocabItem[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect English sentence (starts with uppercase or ALL CAPS)
    // followed by a Japanese translation in parentheses on the next line
    if (/^[A-Z（【]/.test(line) && !line.includes("：") && !line.startsWith("（")) {
      const english = line;
      let japanese = "";
      // Check if next line is Japanese translation (starts with （ or is Japanese)
      if (i + 1 < lines.length && (lines[i + 1].startsWith("（") || /^[ぁ-んァ-ン一-龥]/.test(lines[i + 1]))) {
        japanese = lines[i + 1].replace(/^（|）$/g, "");
        i += 2;
      } else {
        i++;
      }
      sentences.push({ english, japanese });
    } else if (line.includes("：") && !line.startsWith("（")) {
      // Vocabulary: "word: definition" or "word：definition"
      const colonIdx = line.indexOf("：");
      if (colonIdx > 0) {
        const word = line.slice(0, colonIdx).trim();
        const definition = line.slice(colonIdx + 1).trim();
        if (word && definition) {
          vocabulary.push({ word, definition });
        }
      }
      i++;
    } else {
      i++;
    }
  }

  return { sentences, vocabulary };
}

export default function ArticleView({ week, article }: ArticleViewProps) {
  const { addParagraph, updateParagraph, deleteParagraph, toggleMarkedWord } = useApp();

  // Add paragraph dialog
  const [addParaOpen, setAddParaOpen] = useState(false);
  const [paraTitle, setParaTitle] = useState("");
  const [paraRaw, setParaRaw] = useState("");

  const handleAddParagraph = () => {
    if (!paraTitle.trim()) return;
    const { sentences, vocabulary } = parseParagraphInput(paraRaw);
    addParagraph(week.id, article.id, {
      title: paraTitle.trim(),
      sentences,
      vocabulary,
    });
    setParaTitle("");
    setParaRaw("");
    setAddParaOpen(false);
    toast.success("段落を追加しました");
  };

  const totalMarked = article.paragraphs.reduce(
    (acc, p) => acc + p.markedWords.length,
    0
  );
  const unknownCount = article.paragraphs.reduce(
    (acc, p) => acc + p.markedWords.filter((w) => w.markType === "unknown").length,
    0
  );
  const unsureCount = article.paragraphs.reduce(
    (acc, p) => acc + p.markedWords.filter((w) => w.markType === "unsure").length,
    0
  );

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Article header */}
        <div className="mb-8">
          <hr className="economist-rule mb-4" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.42 0.18 25)", fontFamily: "var(--font-ui)" }}>
                {week.label}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {article.title}
              </h1>
            </div>
            <BookOpen size={24} className="shrink-0 mt-1" style={{ color: "oklch(0.42 0.18 25)" }} />
          </div>

          {/* Stats */}
          {totalMarked > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-sm" style={{ background: "var(--mark-unknown-bg)", color: "var(--mark-unknown)", fontFamily: "var(--font-ui)" }}>
                わからなかった: {unknownCount}語
              </span>
              <span className="text-xs px-2 py-1 rounded-sm" style={{ background: "var(--mark-unsure-bg)", color: "var(--mark-unsure)", fontFamily: "var(--font-ui)" }}>
                微妙: {unsureCount}語
              </span>
            </div>
          )}
        </div>

        {/* Tabs: 記事 / 復習 */}
        <Tabs defaultValue="article">
          <TabsList className="mb-6">
            <TabsTrigger value="article">記事・段落</TabsTrigger>
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
          <TabsContent value="article" className="space-y-4">
            {article.paragraphs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-sm">
                <p className="text-muted-foreground mb-4" style={{ fontFamily: "var(--font-ui)" }}>
                  段落がまだありません
                </p>
                <Button onClick={() => setAddParaOpen(true)} className="gap-2">
                  <Plus size={14} /> 段落を追加
                </Button>
              </div>
            ) : (
              <>
                {article.paragraphs.map((para, i) => (
                  <ParagraphCard
                    key={para.id}
                    paragraph={para}
                    index={i}
                    weekId={week.id}
                    articleId={article.id}
                    onUpdate={(patch) => updateParagraph(week.id, article.id, para.id, patch)}
                    onDelete={() => {
                      deleteParagraph(week.id, article.id, para.id);
                      toast.success("段落を削除しました");
                    }}
                    onToggleWord={(word) => toggleMarkedWord(week.id, article.id, para.id, word)}
                  />
                ))}
                <Button variant="outline" onClick={() => setAddParaOpen(true)} className="w-full gap-2 mt-2">
                  <Plus size={14} /> 段落を追加
                </Button>
              </>
            )}
          </TabsContent>

          {/* Review tab */}
          <TabsContent value="review">
            <ReviewSection week={week} article={article} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Paragraph Dialog */}
      <Dialog open={addParaOpen} onOpenChange={setAddParaOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">段落を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>段落タイトル（日本語）</Label>
              <Input
                value={paraTitle}
                onChange={(e) => setParaTitle(e.target.value)}
                placeholder="例：混迷を極めるトランプ大統領の対イラン政策"
              />
            </div>
            <div className="space-y-1.5">
              <Label>本文を貼り付け</Label>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-ui)" }}>
                以下の形式で貼り付けてください：<br />
                英語文<br />
                （日本語訳）<br />
                単語：意味
              </p>
              <Textarea
                value={paraRaw}
                onChange={(e) => setParaRaw(e.target.value)}
                placeholder={`EVEN BY HIS chaotic standards, Donald Trump has just presided over an unusually wild week in his misguided war on Iran.\n（トランプ大統領自身の混乱した基準に照らしても...）\nchaotic：混乱した\npreside over：～を主宰する`}
                className="min-h-[200px] text-sm"
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddParaOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddParagraph} disabled={!paraTitle.trim()}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
