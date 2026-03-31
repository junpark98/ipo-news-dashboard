# 딜 뉴스 모니터 (IPO News Dashboard)

더벨 · 딜사이트 주요 딜 뉴스를 키워드별로 모니터링하는 Next.js 웹 대시보드입니다.

## 기능

- **왼쪽 사이드바**: 키워드 목록 (IPO 주관사, M&A 등) — 클릭 시 해당 키워드 뉴스 표시
- **오른쪽 뉴스 그리드**: 더벨 + 딜사이트 기사를 최신순으로 표시
- **출처 필터**: 전체 / 더벨 / 딜사이트 탭으로 필터링
- **키워드 추가/삭제**: 사이드바에서 커스텀 키워드 자유롭게 관리
- **1시간 캐시**: 동일 키워드 재조회 시 서버 부담 최소화

---

## 로컬 실행

### 1. 패키지 설치

```bash
cd ipo-news-dashboard
npm install
```

### 2. 환경 변수 설정

`.env.local.example`을 복사해 `.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 더벨 · 딜사이트 계정 정보 입력:

```env
THEBELL_ID=본인_더벨_아이디
THEBELL_PW=본인_더벨_비밀번호
DEALSITE_EMAIL=본인_딜사이트_이메일
DEALSITE_PW=본인_딜사이트_비밀번호
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## Vercel 배포

### 방법 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### 방법 2: GitHub 연동 (권장)

1. `ipo-news-dashboard` 폴더를 GitHub 레포지토리로 push
2. [vercel.com](https://vercel.com)에서 해당 레포 Import
3. **Environment Variables** 설정:
   | 변수명 | 값 |
   |--------|-----|
   | `THEBELL_ID` | 더벨 아이디 |
   | `THEBELL_PW` | 더벨 비밀번호 |
   | `DEALSITE_EMAIL` | 딜사이트 이메일 |
   | `DEALSITE_PW` | 딜사이트 비밀번호 |
4. Deploy 클릭

---

## 스크래퍼 셀렉터 조정

두 사이트는 주기적으로 HTML 구조가 변경될 수 있습니다. 기사가 수집되지 않을 경우:

### 더벨 (`lib/scrapers/thebell.ts`)

브라우저 개발자 도구에서 기사 목록 HTML 확인 후 셀렉터 수정:

```typescript
// 현재 셀렉터
$("ul.news_list li, .news-list-item, .list_item").each(...)

// 기사 링크 패턴
$("a[href*='newsview']")
```

검색 URL: `https://www.thebell.co.kr/front/NewsListShort.asp?code=00&keyword=검색어`

### 딜사이트 (`lib/scrapers/dealsite.ts`)

```typescript
// 현재 셀렉터
$("article, .article-item, .news-item, li.item").each(...)

// 기사 링크 패턴
$("a[href*='/articles/']")
```

검색 URL: `https://dealsite.co.kr/articles?keyword=검색어`

---

## 기본 키워드 목록

| 키워드 | 검색어 |
|--------|--------|
| IPO 주관사 선정 | IPO 주관사 선정 |
| IPO 주간사 선정 | 주간사 선정 |
| 대표주관사 | 대표주관사 |
| 상장예비심사 | 상장예비심사 |
| 코스피 상장 | 코스피 상장 |
| 코스닥 상장 | 코스닥 상장 |
| 기업공개 IPO | 기업공개 |
| PE 펀드 결성 | PE 펀드 결성 |
| M&A 딜 | M&A 인수합병 |
| 투자 유치 | 투자유치 시리즈 |

사이드바 하단 **"키워드 추가"** 버튼으로 원하는 키워드를 자유롭게 추가할 수 있습니다.

---

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Axios** + **Cheerio** (서버사이드 스크래핑)
- **Vercel** 배포
