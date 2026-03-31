import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.investchosun.com";

interface RawArticle {
  title: string;
  url: string;
  date: string;
  summary: string;
}

// 인베스트조선 IB 섹션 (catid=2) 스크래핑
async function scrapeSection(page = 1): Promise<RawArticle[]> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Referer: BASE_URL,
  };

  // catid=2 는 IB/자본시장 섹션
  const url = `${BASE_URL}/svc/news/list.html?catid=2&page=${page}`;

  try {
    const res = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(res.data);
    const articles: RawArticle[] = [];

    // /site/data/html_dir/ 패턴의 링크 추출
    $("a[href*='/site/data/html_dir/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const title = $(el).text().trim();

      if (title.length < 5) return;
      if (title.includes("더보기") || title.includes("전체기사")) return;

      const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      // URL에서 날짜 추출 (/2026/03/30/2026033080126.html → 2026.03.30)
      const dateMatch = href.match(/html_dir\/(\d{4})\/(\d{2})\/(\d{2})/);
      const date = dateMatch
        ? `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`
        : "";

      articles.push({ title, url: fullUrl, date, summary: "" });
    });

    // 중복 제거
    const seen = new Set<string>();
    return articles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });
  } catch (err) {
    console.error(`[InvestChosun] 스크래핑 실패 (page: ${page}):`, err);
    return [];
  }
}

// 인베스트조선 IB 섹션 1~2페이지 수집 후 관련성 필터링
export async function scrapeInvestchosun(
  relevanceTerms: string[]
): Promise<RawArticle[]> {
  const [page1, page2] = await Promise.allSettled([
    scrapeSection(1),
    scrapeSection(2),
  ]);

  const allArticles: RawArticle[] = [];
  const seenUrls = new Set<string>();

  for (const result of [page1, page2]) {
    if (result.status !== "fulfilled") continue;
    for (const article of result.value) {
      if (seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);
      allArticles.push(article);
    }
  }

  // 관련성 필터
  return allArticles.filter((article) =>
    relevanceTerms.some((term) =>
      article.title.toLowerCase().includes(term.toLowerCase())
    )
  );
}
