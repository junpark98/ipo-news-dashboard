import { NextRequest, NextResponse } from "next/server";
import { scrapeThebell } from "@/lib/scrapers/thebell";
import { scrapeDealsite } from "@/lib/scrapers/dealsite";
import { scrapeGoogleNews } from "@/lib/scrapers/googlenews";
import { scrapeInvestchosun } from "@/lib/scrapers/investchosun";
import { NewsArticle, DEFAULT_CATEGORIES } from "@/lib/types";

// 서버 메모리 캐시
const cache = new Map<string, { data: NewsArticle[]; time: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category") || "ipo";
  const forceRefresh = searchParams.get("refresh") === "true";
  // 커스텀 카테고리용 파라미터
  const customQueries = searchParams.get("queries"); // 쉼표 구분
  const customTerms = searchParams.get("terms"); // 쉼표 구분

  // 기본 카테고리 또는 커스텀 파라미터에서 설정 추출
  const defaultCat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);

  let searchQueries: string[];
  let googleNewsQueries: string[];
  let relevanceTerms: string[];
  let thebellSectionCodes: string[];
  let label: string;
  let cacheKey: string;

  if (defaultCat) {
    searchQueries = defaultCat.searchQueries;
    googleNewsQueries = defaultCat.googleNewsQueries;
    relevanceTerms = defaultCat.relevanceTerms;
    thebellSectionCodes = defaultCat.thebellSectionCodes;
    label = defaultCat.label;
    cacheKey = categoryId;
  } else if (customQueries) {
    // 커스텀 카테고리: queries 파라미터에서 검색어 추출
    const queries = customQueries.split(",").map((q) => q.trim()).filter(Boolean);
    const terms = customTerms
      ? customTerms.split(",").map((t) => t.trim()).filter(Boolean)
      : queries;
    searchQueries = queries;
    googleNewsQueries = queries;
    relevanceTerms = terms;
    thebellSectionCodes = ["0100"];
    label = queries[0] || "커스텀";
    cacheKey = `custom:${queries.join(",")}`;
  } else {
    return NextResponse.json(
      { error: "알 수 없는 카테고리입니다." },
      { status: 400 }
    );
  }

  // 캐시 확인
  const cached = cache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.time < CACHE_TTL) {
    return NextResponse.json({
      articles: cached.data,
      cached: true,
      category: label,
      total: cached.data.length,
    });
  }

  try {
    // 4개 소스 동시 스크래핑
    const [thebellRaw, dealsiteRaw, googleNewsRaw, investchosunRaw] =
      await Promise.allSettled([
        scrapeThebell(thebellSectionCodes, relevanceTerms),
        scrapeDealsite(searchQueries, relevanceTerms),
        scrapeGoogleNews(googleNewsQueries, relevanceTerms),
        scrapeInvestchosun(relevanceTerms),
      ]);

    const articles: NewsArticle[] = [];

    if (thebellRaw.status === "fulfilled") {
      for (const item of thebellRaw.value) {
        articles.push({
          id: `tb-${extractKey(item.url)}`,
          title: item.title,
          url: item.url,
          source: "thebell",
          sourceName: "더벨",
          date: item.date,
          summary: item.summary || undefined,
        });
      }
    }

    if (dealsiteRaw.status === "fulfilled") {
      for (const item of dealsiteRaw.value) {
        articles.push({
          id: `ds-${extractArticleId(item.url)}`,
          title: item.title,
          url: item.url,
          source: "dealsite",
          sourceName: "딜사이트",
          date: item.date,
          summary: item.summary || undefined,
        });
      }
    }

    if (googleNewsRaw.status === "fulfilled") {
      for (const item of googleNewsRaw.value) {
        articles.push({
          id: `gn-${hashString(item.title)}`,
          title: item.title,
          url: item.url,
          source: "googlenews",
          sourceName: item.sourceName || "뉴스",
          date: item.date,
          summary: item.summary || undefined,
        });
      }
    }

    if (investchosunRaw.status === "fulfilled") {
      for (const item of investchosunRaw.value) {
        articles.push({
          id: `ic-${hashString(item.url)}`,
          title: item.title,
          url: item.url,
          source: "investchosun",
          sourceName: "인베스트조선",
          date: item.date,
          summary: item.summary || undefined,
        });
      }
    }

    // 제목 기반 중복 제거
    const deduplicated = deduplicateArticles(articles);

    // 날짜 기준 최신순 정렬
    deduplicated.sort((a, b) => parseDate(b.date) - parseDate(a.date));

    // 캐시 저장
    cache.set(cacheKey, { data: deduplicated, time: Date.now() });

    const stats = {
      thebell: articles.filter((a) => a.source === "thebell").length,
      dealsite: articles.filter((a) => a.source === "dealsite").length,
      googlenews: articles.filter((a) => a.source === "googlenews").length,
      investchosun: articles.filter((a) => a.source === "investchosun").length,
      total: deduplicated.length,
      duplicatesRemoved: articles.length - deduplicated.length,
    };
    console.log(`[뉴스 수집 완료] ${label}:`, stats);

    return NextResponse.json({
      articles: deduplicated,
      cached: false,
      category: label,
      total: deduplicated.length,
      stats,
    });
  } catch (err) {
    console.error("뉴스 수집 오류:", err);
    return NextResponse.json(
      { error: "뉴스 수집 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 제목 유사도 기반 중복 제거
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const result: NewsArticle[] = [];
  const seenTitles: string[] = [];

  const sourcePriority: Record<string, number> = {
    thebell: 1,
    dealsite: 2,
    investchosun: 3,
    googlenews: 4,
  };

  const sorted = [...articles].sort(
    (a, b) => (sourcePriority[a.source] || 9) - (sourcePriority[b.source] || 9)
  );

  for (const article of sorted) {
    const normalized = normalizeTitle(article.title);
    const isDuplicate = seenTitles.some(
      (existing) => titleSimilarity(existing, normalized) > 0.6
    );
    if (!isDuplicate) {
      result.push(article);
      seenTitles.push(normalized);
    }
  }

  return result;
}

function normalizeTitle(title: string): string {
  return title
    .replace(/[\[\]'"''""「」『』·…\s\n\t]/g, "")
    .replace(/[^가-힣a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function titleSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (shorter.length === 0) return 0;
  if (longer.includes(shorter)) return shorter.length / longer.length + 0.3;
  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));
  let common = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (bigramsA.has(b.slice(i, i + 2))) common++;
  }
  const total = Math.max(bigramsA.size, b.length - 1);
  return total > 0 ? common / total : 0;
}

function extractKey(url: string): string {
  const match = url.match(/key=(\d+)/);
  return match ? match[1] : String(Date.now());
}

function extractArticleId(url: string): string {
  const match = url.match(/\/articles\/(\d+)/);
  return match ? match[1] : String(Date.now());
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function parseDate(dateStr: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/(\d{4})[.\-](\d{2})[.\-](\d{2})/);
  if (match) return new Date(`${match[1]}-${match[2]}-${match[3]}`).getTime();
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
}
