import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://dealsite.co.kr";

interface RawArticle {
  title: string;
  url: string;
  date: string;
  summary: string;
}

// 딜사이트 키워드 검색 (로그인 없이 공개 기사 수집)
async function searchDealsite(query: string): Promise<RawArticle[]> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Referer: BASE_URL,
  };

  // 딜사이트 검색 URL (키워드 기반)
  const searchUrl = `${BASE_URL}/search/?LIKE=${encodeURIComponent(query)}&SEARCHFIELD=KEYWORD`;

  try {
    const res = await axios.get(searchUrl, {
      headers,
      timeout: 15000,
      maxRedirects: 5,
    });
    const $ = cheerio.load(res.data);
    const articles: RawArticle[] = [];

    // /articles/숫자 패턴의 링크를 가진 모든 요소 추출
    $("a[href*='/articles/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!/\/articles\/\d+/.test(href)) return;

      const title = $(el).text().trim();
      if (title.length < 5) return;
      // 네비게이션/메뉴 텍스트 제외
      if (title.includes("전체기사") || title.includes("더보기")) return;

      const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      // 부모 컨테이너에서 날짜/요약 추출
      const container = $(el).closest("li, article, div, tr").first();
      let date = "";
      let summary = "";

      // 날짜 추출 시도
      const dateEl = container.find("time, .date, .pub-date, .article-date, span");
      dateEl.each((_, d) => {
        const text = $(d).text().trim();
        if (/\d{4}\.\d{2}\.\d{2}/.test(text) && !date) {
          date = text;
        }
      });

      // 요약 추출
      const descEl = container.find("p, .summary, .description");
      if (descEl.length > 0) {
        summary = descEl.first().text().trim().slice(0, 200);
      }

      articles.push({ title, url, date, summary });
    });

    // 중복 제거 (URL 기준)
    const seen = new Set<string>();
    return articles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });
  } catch (err) {
    console.error(`[DealSite] 검색 실패 (query: ${query}):`, err);
    return [];
  }
}

// 여러 검색 쿼리로 딜사이트 기사 수집 후 합산
export async function scrapeDealsite(
  searchQueries: string[],
  relevanceTerms: string[]
): Promise<RawArticle[]> {
  // 모든 검색어에 대해 병렬 검색
  const results = await Promise.allSettled(
    searchQueries.map((q) => searchDealsite(q))
  );

  const allArticles: RawArticle[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const article of result.value) {
      if (seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);
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
