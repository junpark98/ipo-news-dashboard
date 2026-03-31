import axios from "axios";
import * as cheerio from "cheerio";

interface RawArticle {
  title: string;
  url: string;
  date: string;
  summary: string;
  sourceName: string;
}

// Google News RSS에서 키워드 검색 결과 수집
async function searchGoogleNews(query: string): Promise<RawArticle[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await axios.get(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const articles: RawArticle[] = [];

    $("item").each((_, el) => {
      const rawTitle = $(el).find("title").text().trim();
      const link = $(el).find("link").text().trim();
      const pubDate = $(el).find("pubDate").text().trim();
      const sourceEl = $(el).find("source");
      const sourceName = sourceEl.text().trim() || extractSourceFromTitle(rawTitle);

      // Google News RSS 제목은 "기사 제목 - 매체명" 형식
      const title = rawTitle.replace(/\s*-\s*[^-]+$/, "").trim() || rawTitle;

      if (!title || !link) return;

      // 날짜 포맷 변환 (RFC 2822 → YYYY.MM.DD)
      const date = formatRssDate(pubDate);

      articles.push({
        title,
        url: link,
        date,
        summary: "",
        sourceName,
      });
    });

    return articles;
  } catch (err) {
    console.error(`[GoogleNews] RSS 수집 실패 (query: ${query}):`, err);
    return [];
  }
}

// 여러 검색어로 Google News 수집 후 합산
export async function scrapeGoogleNews(
  searchQueries: string[],
  relevanceTerms: string[]
): Promise<RawArticle[]> {
  // 각 검색어 병렬 실행
  const results = await Promise.allSettled(
    searchQueries.map((q) => searchGoogleNews(q))
  );

  const allArticles: RawArticle[] = [];
  const seenTitles = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const article of result.value) {
      // 제목 기반 중복 제거 (같은 기사가 여러 매체에서 보도됨)
      const normalizedTitle = article.title.replace(/\s+/g, " ").trim();
      if (seenTitles.has(normalizedTitle)) continue;
      seenTitles.add(normalizedTitle);
      allArticles.push(article);
    }
  }

  // 관련성 필터: 제목에 relevanceTerms 중 하나라도 포함되어야 함
  const filtered = allArticles.filter((article) =>
    relevanceTerms.some((term) =>
      article.title.toLowerCase().includes(term.toLowerCase())
    )
  );

  return filtered;
}

function extractSourceFromTitle(rawTitle: string): string {
  const match = rawTitle.match(/\s*-\s*([^-]+)$/);
  return match ? match[1].trim() : "뉴스";
}

function formatRssDate(rssDate: string): string {
  if (!rssDate) return "";
  try {
    const d = new Date(rssDate);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  } catch {
    return "";
  }
}
