import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.thebell.co.kr";

interface RawArticle {
  title: string;
  url: string;
  date: string;
  summary: string;
}

// 더벨 섹션 페이지에서 기사 목록 추출
async function scrapeSection(sectionCode: string, page = 1): Promise<RawArticle[]> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Referer: BASE_URL,
  };

  // 더벨 로그인 쿠키 (설정된 경우)
  const id = process.env.THEBELL_ID;
  const pw = process.env.THEBELL_PW;
  if (id && pw) {
    try {
      const loginRes = await axios.post(
        `${BASE_URL}/front/loginsub.asp`,
        new URLSearchParams({ user_id: id, user_pw: pw, chkSave: "Y" }).toString(),
        {
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          maxRedirects: 5,
          timeout: 10000,
        }
      );
      const cookies = loginRes.headers["set-cookie"]?.join("; ");
      if (cookies) headers["Cookie"] = cookies;
    } catch {
      console.warn("[TheBell] 로그인 실패 - 공개 기사만 수집");
    }
  }

  const sectionUrl = `${BASE_URL}/front/NewsList.asp?code=${sectionCode}&page=${page}`;

  try {
    const res = await axios.get(sectionUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(res.data);
    const articles: RawArticle[] = [];

    // newsview 링크가 포함된 모든 a 태그 추출
    $("a[href*='newsview.asp']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const title = $(el).text().replace(/[\n\t\r]+/g, " ").replace(/\s{2,}/g, " ").trim();

      if (title.length < 5) return;
      // 네비게이션/메뉴 텍스트 제외
      if (title === "뉴스보기" || title.includes("더보기")) return;

      const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      // key 값에서 날짜 추출 (key=202603301140484040105182 → 2026.03.30)
      const keyMatch = href.match(/key=(\d{4})(\d{2})(\d{2})/);
      const date = keyMatch ? `${keyMatch[1]}.${keyMatch[2]}.${keyMatch[3]}` : "";

      articles.push({ title, url, date, summary: "" });
    });

    // 중복 제거
    const seen = new Set<string>();
    return articles.filter((a) => {
      // URL에서 key 파라미터만 비교 (code가 다를 수 있음)
      const keyMatch = a.url.match(/key=(\d+)/);
      const key = keyMatch ? keyMatch[1] : a.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.error(`[TheBell] 섹션 스크래핑 실패 (code: ${sectionCode}):`, err);
    return [];
  }
}

// 더벨 여러 섹션에서 기사 수집 후 관련성 필터링
export async function scrapeThebell(
  sectionCodes: string[],
  relevanceTerms: string[]
): Promise<RawArticle[]> {
  // 각 섹션 1~2페이지 병렬 스크래핑
  const tasks: Promise<RawArticle[]>[] = [];
  for (const code of sectionCodes) {
    tasks.push(scrapeSection(code, 1));
    tasks.push(scrapeSection(code, 2));
  }

  const results = await Promise.allSettled(tasks);

  const allArticles: RawArticle[] = [];
  const seenKeys = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const article of result.value) {
      const keyMatch = article.url.match(/key=(\d+)/);
      const key = keyMatch ? keyMatch[1] : article.url;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
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
