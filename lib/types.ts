export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: "thebell" | "dealsite" | "investchosun" | "googlenews";
  sourceName: string; // 실제 매체명 (Google News의 경우 원본 매체명)
  date: string;
  summary?: string;
}

// 카테고리 = 사이드바 키워드 하나
export interface KeywordCategory {
  id: string;
  label: string;
  // 딜사이트 + Google News 검색에 사용할 쿼리 목록
  searchQueries: string[];
  // Google News에 특화된 검색어 (더 구체적 가능)
  googleNewsQueries: string[];
  // 기사 제목에 이 중 하나라도 포함되면 관련 기사로 판단
  relevanceTerms: string[];
  // 더벨 섹션 코드 (0100=IB/Deal, 0200=금융, 0400=산업)
  thebellSectionCodes: string[];
}

export const DEFAULT_CATEGORIES: KeywordCategory[] = [
  {
    id: "ipo",
    label: "IPO",
    searchQueries: ["IPO", "상장", "공모", "주관사"],
    googleNewsQueries: [
      "IPO 주관사 선정",
      "IPO 주간사 선정",
      "IPO 대표주관사",
      "상장예비심사 청구",
      "코스피 코스닥 상장 추진",
      "기업공개 IPO 추진",
      "공모가 수요예측",
    ],
    relevanceTerms: [
      "IPO",
      "주관사",
      "주간사",
      "대표주관",
      "상장",
      "공모",
      "기업공개",
      "예비심사",
      "수요예측",
      "공모가",
      "청약",
      "프리IPO",
      "스팩",
      "SPAC",
    ],
    thebellSectionCodes: ["0100"],
  },
  {
    id: "ma",
    label: "M&A",
    searchQueries: ["인수합병", "M&A", "매각"],
    googleNewsQueries: [
      "M&A 인수합병",
      "경영권 매각",
      "지분 인수",
      "바이아웃 MBO LBO",
    ],
    relevanceTerms: [
      "M&A",
      "인수",
      "합병",
      "매각",
      "인수합병",
      "지분매각",
      "경영권",
      "피인수",
      "바이아웃",
      "buyout",
      "MBO",
      "LBO",
    ],
    thebellSectionCodes: ["0100"],
  },
  {
    id: "pe-vc",
    label: "PE / VC",
    searchQueries: ["PE 펀드", "벤처투자", "투자유치"],
    googleNewsQueries: [
      "PE 펀드 결성",
      "벤처투자 시리즈",
      "투자유치 라운드",
      "사모펀드 블라인드펀드",
    ],
    relevanceTerms: [
      "PE",
      "VC",
      "벤처",
      "사모펀드",
      "펀드",
      "투자유치",
      "시리즈",
      "엑시트",
      "GP",
      "LP",
      "블라인드펀드",
      "프로젝트펀드",
      "운용사",
    ],
    thebellSectionCodes: ["0100"],
  },
];
