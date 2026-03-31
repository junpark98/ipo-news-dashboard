"use client";

import { useState } from "react";
import { Plus, X, Tag, BarChart2 } from "lucide-react";
import { KeywordCategory, DEFAULT_CATEGORIES } from "@/lib/types";

interface SidebarProps {
  categories: KeywordCategory[];
  activeCategoryId: string;
  onSelect: (category: KeywordCategory) => void;
  onAdd: (category: KeywordCategory) => void;
  onRemove: (id: string) => void;
}

export default function Sidebar({
  categories,
  activeCategoryId,
  onSelect,
  onAdd,
  onRemove,
}: SidebarProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTerms, setNewTerms] = useState("");

  const handleAdd = () => {
    if (!newLabel.trim() || !newTerms.trim()) return;
    const terms = newTerms.split(",").map((t) => t.trim()).filter(Boolean);
    onAdd({
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      searchQueries: terms,
      googleNewsQueries: terms,
      relevanceTerms: terms,
      thebellSectionCodes: ["0100"],
    });
    setNewLabel("");
    setNewTerms("");
    setShowAddForm(false);
  };

  const isDefault = (id: string) => DEFAULT_CATEGORIES.some((c) => c.id === id);

  return (
    <aside className="w-64 min-h-screen bg-[#1a1f2e] flex flex-col fixed left-0 top-0 bottom-0 z-10">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-[#2d3548]">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-blue-400" size={22} />
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">딜 뉴스 모니터</h1>
            <p className="text-[#8892a4] text-xs mt-0.5">더벨 + 딜사이트</p>
          </div>
        </div>
      </div>

      {/* 카테고리 목록 */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2">
        <div className="px-2 mb-2">
          <span className="text-[#8892a4] text-xs font-semibold uppercase tracking-wider">
            모니터링 키워드
          </span>
        </div>

        <ul className="space-y-0.5">
          {categories.map((cat) => (
            <li key={cat.id} className="group flex items-center">
              <button
                onClick={() => onSelect(cat)}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                  activeCategoryId === cat.id
                    ? "bg-blue-600 text-white font-medium"
                    : "text-[#8892a4] hover:bg-[#252b3b] hover:text-[#c8d3e0]"
                }`}
              >
                <Tag size={13} className="shrink-0 opacity-70" />
                <div className="min-w-0">
                  <span className="truncate block">{cat.label}</span>
                  <span
                    className={`text-xs truncate block mt-0.5 ${
                      activeCategoryId === cat.id ? "text-blue-200" : "text-[#5a6478]"
                    }`}
                  >
                    {cat.relevanceTerms.slice(0, 3).join(", ")}...
                  </span>
                </div>
              </button>
              {!isDefault(cat.id) && (
                <button
                  onClick={() => onRemove(cat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-[#8892a4] hover:text-red-400 transition-all rounded"
                  title="카테고리 삭제"
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* 카테고리 추가 */}
        <div className="mt-4 px-2">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#8892a4] hover:bg-[#252b3b] hover:text-blue-400 text-sm transition-all border border-dashed border-[#2d3548] hover:border-blue-500"
            >
              <Plus size={14} />
              <span>키워드 추가</span>
            </button>
          ) : (
            <div className="bg-[#252b3b] rounded-lg p-3 space-y-2">
              <input
                type="text"
                placeholder="카테고리 이름 (예: 리츠)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-[#1a1f2e] border border-[#3d4a63] text-white placeholder-[#8892a4] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="검색어 (쉼표 구분, 예: 리츠,REITs,부동산)"
                value={newTerms}
                onChange={(e) => setNewTerms(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full bg-[#1a1f2e] border border-[#3d4a63] text-white placeholder-[#8892a4] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
              <p className="text-[#5a6478] text-xs">
                기사 제목에 위 검색어 중 하나 이상 포함된 기사만 표시됩니다
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded font-medium transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewLabel("");
                    setNewTerms("");
                  }}
                  className="flex-1 bg-[#1a1f2e] hover:bg-[#3d4a63] text-[#8892a4] text-xs py-1.5 rounded transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 하단 */}
      <div className="px-5 py-3 border-t border-[#2d3548]">
        <p className="text-[#8892a4] text-xs text-center">K2 Investment Partners</p>
      </div>
    </aside>
  );
}
