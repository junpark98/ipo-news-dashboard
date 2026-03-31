"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, Newspaper } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import NewsCard from "@/components/NewsCard";
import { NewsArticle, KeywordCategory, DEFAULT_CATEGORIES } from "@/lib/types";

const STORAGE_KEY = "ipo-monitor-custom-categories";

function loadCustomCategories(): KeywordCategory[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(categories: KeywordCategory[]) {
  const custom = categories.filter(
    (c) => !DEFAULT_CATEGORIES.some((d) => d.id === c.id)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-4/5 rounded" />
      <div className="skeleton h-3 w-full rounded" />
    </div>
  );
}

export default function Home() {
  const [categories, setCategories] = useState<KeywordCategory[]>(() => [
    ...DEFAULT_CATEGORIES,
    ...loadCustomCategories(),
  ]);
  const [activeCategory, setActiveCategory] = useState<KeywordCategory>(DEFAULT_CATEGORIES[0]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchNews = useCallback(async (category: KeywordCategory, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // 기본 카테고리는 ID로, 커스텀 카테고리는 검색어를 직접 전달
      const isCustom = category.id.startsWith("custom-");
      let url: string;
      if (isCustom) {
        const queries = category.searchQueries.join(",");
        const terms = category.relevanceTerms.join(",");
        url = `/api/news?category=${encodeURIComponent(category.id)}&queries=${encodeURIComponent(queries)}&terms=${encodeURIComponent(terms)}${forceRefresh ? "&refresh=true" : ""}`;
      } else {
        url = `/api/news?category=${encodeURIComponent(category.id)}${forceRefresh ? "&refresh=true" : ""}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("서버 오류가 발생했습니다.");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setArticles(data.articles || []);
      setFromCache(data.cached || false);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "뉴스를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory, fetchNews]);

  const handleSelect = (cat: KeywordCategory) => {
    setActiveCategory(cat);
  };

  const handleAdd = (cat: KeywordCategory) => {
    setCategories((prev) => {
      const next = [...prev, cat];
      saveCustomCategories(next);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCustomCategories(next);
      return next;
    });
    if (activeCategory.id === id) {
      setActiveCategory(DEFAULT_CATEGORIES[0]);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        categories={categories}
        activeCategoryId={activeCategory.id}
        onSelect={handleSelect}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />

      <main className="ml-64 flex-1 min-h-screen">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Newspaper size={18} className="text-blue-600" />
                <h2 className="font-bold text-gray-900 text-lg">{activeCategory.label}</h2>
                {!loading && articles.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {articles.length}건
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">
                  {lastUpdated && (
                    <>
                      {fromCache ? "캐시됨 · " : ""}
                      {lastUpdated.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      업데이트
                    </>
                  )}
                </p>
                <div className="flex flex-wrap gap-1">
                  {activeCategory.relevanceTerms.slice(0, 5).map((term) => (
                    <span
                      key={term}
                      className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchNews(activeCategory, true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "수집 중..." : "새로고침"}
            </button>
          </div>
        </div>

        {/* 뉴스 목록 */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Newspaper size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">관련 기사가 없습니다</p>
              <p className="text-sm mt-1">
                &ldquo;{activeCategory.label}&rdquo; 관련 기사를 찾지 못했습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
