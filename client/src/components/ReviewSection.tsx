// ============================================================
// ReviewSection - 復習チェック記録コンポーネント
// Design: Editorial Brutalism
// ============================================================

import { useState } from "react";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import type { Article, Week, ReviewRecord } from "@/lib/types";

const REVIEW_METHODS = ["読む", "聞く", "書く", "音読", "その他"];

interface ReviewSectionProps {
  week: Week;
  article: Article;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function ReviewSection({ week, article }: ReviewSectionProps) {
  const { addReviewRecord, deleteReviewRecord } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [method, setMethod] = useState<string>("読む");
  const [customMethod, setCustomMethod] = useState("");
  const [note, setNote] = useState("");
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 16));

  const handleAdd = () => {
    const finalMethod = method === "その他" ? customMethod.trim() || "その他" : method;
    addReviewRecord(week.id, article.id, {
      date: new Date(dateStr).toISOString(),
      method: finalMethod,
      note: note.trim() || undefined,
    });
    setNote("");
    setCustomMethod("");
    setDialogOpen(false);
    toast.success("復習を記録しました");
  };

  const handleDelete = (recordId: string) => {
    deleteReviewRecord(week.id, article.id, recordId);
    toast.success("記録を削除しました");
  };

  // Group by date
  const grouped: { [date: string]: ReviewRecord[] } = {};
  [...article.reviewRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach((r) => {
      const dateKey = r.date.slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(r);
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
            復習チェック
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "var(--font-ui)" }}>
            いつ、どのように復習したかを記録します
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2" size="sm">
          <Plus size={13} /> 記録を追加
        </Button>
      </div>

      {article.reviewRecords.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-sm">
          <Calendar size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-ui)" }}>
            復習の記録がありません
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus size={13} /> 最初の復習を記録
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, records]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <hr className="flex-1 border-border" />
                <span className="text-xs font-semibold" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>
                  {formatDate(records[0].date)}
                </span>
                <hr className="flex-1 border-border" />
              </div>
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-sm group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-semibold px-2 py-0.5 rounded-sm"
                          style={{ background: "oklch(0.42 0.18 25)", color: "white", fontFamily: "var(--font-ui)" }}
                        >
                          {r.method}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: "oklch(0.6 0.01 60)", fontFamily: "var(--font-ui)" }}>
                          <Clock size={11} />
                          {formatTime(r.date)}
                        </span>
                      </div>
                      {r.note && (
                        <p className="text-sm mt-1.5" style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-jp)" }}>
                          {r.note}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">復習を記録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>日時</Label>
              <Input
                type="datetime-local"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>復習方法</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {method === "その他" && (
                <Input
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  placeholder="復習方法を入力"
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>メモ（任意）</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="気づいたことなど..."
                className="resize-none min-h-[80px] text-sm"
                style={{ fontFamily: "var(--font-jp)" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAdd}>記録</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
