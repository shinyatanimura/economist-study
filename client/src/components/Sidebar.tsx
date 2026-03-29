// ============================================================
// Sidebar - 週・記事ナビゲーション
// Design: Editorial Brutalism - dark sidebar, deep charcoal bg
// Changes:
//   - 週に日付を表示
//   - 新しい週が上に来るよう逆順表示
//   - 削除前に確認ダイアログを挟む
// ============================================================

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, BookOpen, Calendar, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Week, Article } from "@/lib/types";

interface SidebarProps {
  selectedWeekId: string | null;
  selectedArticleId: string | null;
  onSelect: (weekId: string, articleId: string) => void;
  onSelectWeek: (weekId: string) => void;
}

function formatIssueDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  } catch {
    return isoDate;
  }
}

export default function Sidebar({ selectedWeekId, selectedArticleId, onSelect, onSelectWeek }: SidebarProps) {
  const { data, addWeek, deleteWeek, addArticle, deleteArticle } = useApp();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Week dialog
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [weekLabel, setWeekLabel] = useState("");
  const [weekDate, setWeekDate] = useState("");

  // Article dialog
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");
  const [targetWeekId, setTargetWeekId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "week" | "article";
    weekId: string;
    articleId?: string;
    label: string;
  } | null>(null);

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const handleAddWeek = () => {
    if (!weekLabel.trim()) return;
    addWeek(weekLabel.trim(), weekDate || new Date().toISOString().slice(0, 10));
    setWeekLabel("");
    setWeekDate("");
    setWeekDialogOpen(false);
    toast.success("週を追加しました");
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "week") {
      deleteWeek(deleteConfirm.weekId);
      toast.success("週を削除しました");
    } else if (deleteConfirm.type === "article" && deleteConfirm.articleId) {
      deleteArticle(deleteConfirm.weekId, deleteConfirm.articleId);
      toast.success("記事を削除しました");
    }
    setDeleteConfirm(null);
  };

  const handleAddArticle = () => {
    if (!articleTitle.trim() || !targetWeekId) return;
    addArticle(targetWeekId, articleTitle.trim());
    setArticleTitle("");
    setArticleDialogOpen(false);
    toast.success("記事を追加しました");
  };

  const openAddArticle = (e: React.MouseEvent, weekId: string) => {
    e.stopPropagation();
    setTargetWeekId(weekId);
    setArticleTitle("");
    setArticleDialogOpen(true);
  };

  // 新しい週が上に来るよう逆順
  const sortedWeeks = [...data.weeks].reverse();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden" style={{ background: "oklch(0.18 0.01 60)" }}>
      {/* Header */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "oklch(0.28 0.01 60)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: "oklch(0.42 0.18 25)" }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>
            The Economist
          </span>
        </div>
        <h1 className="font-display text-lg font-bold" style={{ color: "oklch(0.95 0 0)", fontFamily: "var(--font-display)" }}>
          Study Log
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sortedWeeks.length === 0 && (
          <p className="text-xs px-2 py-4 text-center" style={{ color: "oklch(0.5 0.01 60)" }}>
            週を追加して<br />学習を始めましょう
          </p>
        )}

        {sortedWeeks.map((week: Week) => {
          const isExpanded = expandedWeeks.has(week.id);
          const isSelectedWeek = selectedWeekId === week.id;

          return (
            <div key={week.id} className="mb-1">
              {/* Week row */}
              <div
                className={`flex items-start gap-1 px-2 py-2 rounded cursor-pointer group transition-colors ${isSelectedWeek ? "bg-[oklch(0.25_0.01_60)]" : "hover:bg-[oklch(0.22_0.01_60)]"}`}
                onClick={() => {
                  toggleWeek(week.id);
                  onSelectWeek(week.id);
                }}
              >
                <span className="mt-0.5 shrink-0" style={{ color: "oklch(0.55 0.01 60)" }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <Calendar size={13} className="mt-0.5 shrink-0" style={{ color: "oklch(0.42 0.18 25)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight" style={{ color: "oklch(0.88 0.005 80)", fontFamily: "var(--font-ui)" }}>
                    {week.label}
                  </p>
                  {week.issueDate && (
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.01 60)", fontFamily: "var(--font-ui)" }}>
                      {formatIssueDate(week.issueDate)}
                    </p>
                  )}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded mt-0.5 shrink-0"
                  style={{ color: "oklch(0.55 0.01 60)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ type: "week", weekId: week.id, label: week.label });
                  }}
                  title="週を削除"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Articles */}
              {isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {week.articles.map((article: Article) => {
                    const isActive = selectedWeekId === week.id && selectedArticleId === article.id;
                    return (
                      <div
                        key={article.id}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group transition-all ${
                          isActive
                            ? "border-l-2 pl-1.5"
                            : "border-l-2 border-transparent hover:bg-[oklch(0.22_0.01_60)]"
                        }`}
                        style={isActive ? { borderColor: "oklch(0.42 0.18 25)", background: "oklch(0.25 0.01 60)" } : {}}
                        onClick={() => onSelect(week.id, article.id)}
                      >
                        <BookOpen size={11} style={{ color: isActive ? "oklch(0.42 0.18 25)" : "oklch(0.5 0.01 60)", flexShrink: 0 }} />
                        <span
                          className="flex-1 text-xs truncate"
                          style={{ color: isActive ? "oklch(0.95 0 0)" : "oklch(0.72 0.005 80)", fontFamily: "var(--font-ui)" }}
                        >
                          {article.title}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                          style={{ color: "oklch(0.5 0.01 60)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ type: "article", weekId: week.id, articleId: article.id, label: article.title });
                          }}
                          title="記事を削除"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add article button */}
                  <button
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded w-full text-left transition-colors hover:bg-[oklch(0.22_0.01_60)]"
                    style={{ color: "oklch(0.5 0.01 60)" }}
                    onClick={(e) => openAddArticle(e, week.id)}
                  >
                    <Plus size={11} />
                    <span className="text-xs" style={{ fontFamily: "var(--font-ui)" }}>記事を追加</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Add week button */}
      <div className="p-3 border-t" style={{ borderColor: "oklch(0.28 0.01 60)" }}>
        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-[oklch(0.25_0.01_60)]"
          style={{ color: "oklch(0.65 0.01 60)", fontFamily: "var(--font-ui)" }}
          onClick={() => setWeekDialogOpen(true)}
        >
          <Plus size={14} />
          週を追加
        </button>
      </div>

      {/* Add Week Dialog */}
      <Dialog open={weekDialogOpen} onOpenChange={setWeekDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">週を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ラベル（例：2025年3月第3週）</Label>
              <Input
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="2025年3月第3週"
                onKeyDown={(e) => e.key === "Enter" && handleAddWeek()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>発行日</Label>
              <Input
                type="date"
                value={weekDate}
                onChange={(e) => setWeekDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeekDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddWeek} disabled={!weekLabel.trim()}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Article Dialog */}
      <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">記事を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>記事タイトル</Label>
              <Input
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                placeholder="例：Trump's Iran Policy"
                onKeyDown={(e) => e.key === "Enter" && handleAddArticle()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddArticle} disabled={!articleTitle.trim()}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              削除の確認
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "week"
                ? `「${deleteConfirm.label}」とその中の全記事・段落を削除します。この操作は取り消せません。`
                : `「${deleteConfirm?.label}」を削除します。この操作は取り消せません。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
