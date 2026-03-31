import { ExternalLink, Calendar } from "lucide-react";
import { NewsArticle } from "@/lib/types";

interface NewsCardProps {
  article: NewsArticle;
}

// 소스별 뱃지 스타일
const SOURCE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  thebell: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  dealsite: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  investchosun: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  googlenews: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/(\d{4})[.\-](\d{2})[.\-](\d{2})(?:\s+(\d{2}:\d{2}))?/);
  if (match) {
    const [, year, month, day, time] = match;
    return time ? `${year}.${month}.${day} ${time}` : `${year}.${month}.${day}`;
  }
  return dateStr;
}

export default function NewsCard({ article }: NewsCardProps) {
  const style = SOURCE_STYLES[article.source] || SOURCE_STYLES.googlenews;

  return (
    <article className="news-card bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* 헤더: 출처 뱃지 + 날짜 */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {article.sourceName}
          </span>

          {article.date && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={11} />
              <span>{formatDate(article.date)}</span>
            </div>
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-gray-900 font-semibold text-sm leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* 요약 */}
        {article.summary && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">
            {article.summary}
          </p>
        )}

        {/* 기사 링크 */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span>기사 보기</span>
          <ExternalLink
            size={11}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </a>
      </div>
    </article>
  );
}
