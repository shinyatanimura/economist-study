// ============================================================
// Home - メインページ（サイドバー + コンテンツエリア）
// Design: Editorial Brutalism
// ============================================================

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ArticleView from "@/components/ArticleView";
import { useApp } from "@/contexts/AppContext";
import { BookOpen, Menu, X } from "lucide-react";

export default function Home() {
  const { data } = useApp();
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedWeek = data.weeks.find((w) => w.id === selectedWeekId) ?? null;
  const selectedArticle = selectedWeek?.articles.find((a) => a.id === selectedArticleId) ?? null;

  const handleSelect = (weekId: string, articleId: string) => {
    setSelectedWeekId(weekId);
    setSelectedArticleId(articleId);
    setSidebarOpen(false);
  };

  const handleSelectWeek = (weekId: string) => {
    setSelectedWeekId(weekId);
    setSelectedArticleId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop always visible, mobile slide-in */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          selectedWeekId={selectedWeekId}
          selectedArticleId={selectedArticleId}
          onSelect={handleSelect}
          onSelectWeek={handleSelectWeek}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button
            className="p-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "oklch(0.42 0.18 25)" }} />
            <span className="font-display font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
              {selectedArticle ? selectedArticle.title : "The Economist Study"}
            </span>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {selectedWeek && selectedArticle ? (
            <ArticleView week={selectedWeek} article={selectedArticle} />
          ) : (
            <WelcomeScreen hasData={data.weeks.length > 0} onOpenSidebar={() => setSidebarOpen(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ hasData, onOpenSidebar }: { hasData: boolean; onOpenSidebar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16 text-center">
      <div className="max-w-md">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-4 h-4 rounded-sm" style={{ background: "oklch(0.42 0.18 25)" }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>
            The Economist
          </span>
        </div>

        <hr className="economist-rule mb-6 w-16 mx-auto" />

        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          Study Log
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed mb-8" style={{ fontFamily: "var(--font-ui)" }}>
          {hasData
            ? "左のサイドバーから週・記事を選択して学習を始めてください。"
            : "The Economistの記事を週ごとに整理し、英文の単語マーキングと復習記録ができる学習ツールです。"}
        </p>

        {!hasData && (
          <div className="space-y-4 text-left bg-card border border-border rounded-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.55 0.01 60)", fontFamily: "var(--font-ui)" }}>
              使い方
            </p>
            <ol className="space-y-2 text-sm" style={{ color: "oklch(0.45 0.01 60)", fontFamily: "var(--font-ui)" }}>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "oklch(0.42 0.18 25)" }}>1.</span>
                サイドバーの「週を追加」から週を作成
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "oklch(0.42 0.18 25)" }}>2.</span>
                週の中に記事を追加
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "oklch(0.42 0.18 25)" }}>3.</span>
                記事に段落（英文・日本語訳・語彙）を貼り付け
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "oklch(0.42 0.18 25)" }}>4.</span>
                英単語をクリックして「わからなかった」「微妙」をマーキング
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "oklch(0.42 0.18 25)" }}>5.</span>
                復習チェックタブで復習日時・方法を記録
              </li>
            </ol>
          </div>
        )}

        {/* Mobile: open sidebar button */}
        <button
          className="mt-6 lg:hidden text-sm underline"
          style={{ color: "oklch(0.42 0.18 25)", fontFamily: "var(--font-ui)" }}
          onClick={onOpenSidebar}
        >
          サイドバーを開く →
        </button>
      </div>
    </div>
  );
}
