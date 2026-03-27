"use client";

/* ──────────────────────────────────────────
   NationalitySelect 컴포넌트 (따뜻한 무드 리디자인)
   - 자주 쓰는 국가를 드롭다운 최상단에 고정
   - 타이핑으로 국가 검색 및 자동완성
   - IP 기반 자동 국가 선택 (ipapi.co 호출)
   ────────────────────────────────────────── */

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { POPULAR_COUNTRIES } from "@/types/setup";
import { ALL_COUNTRIES, Country } from "@/types/countries";

interface NationalitySelectProps {
  value: string;
  onChange: (code: string) => void;
}

export default function NationalitySelect({
  value,
  onChange,
}: NationalitySelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* 선택된 국가명 */
  const selectedCountry = ALL_COUNTRIES.find((c) => c.code === value);
  const displayValue = selectedCountry ? selectedCountry.name : "";

  /* ── IP 기반 자동 국가 감지 ── */
  useEffect(() => {
    if (value) return;
    const detectCountry = async () => {
      setIsDetecting(true);
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_code) onChange(data.country_code);
      } catch {
        /* 감지 실패 시 무시 */
      } finally {
        setIsDetecting(false);
      }
    };
    detectCountry();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 외부 클릭 시 드롭다운 닫기 ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── 검색어 기준 필터링 ── */
  const filtered: Country[] = query.trim()
    ? ALL_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showPopular = query.trim() === "";

  const handleSelect = (code: string) => {
    onChange(code);
    setQuery("");
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* 선택 입력창 */}
      <div
        className="flex items-center w-full rounded-2xl px-4 py-3.5 cursor-text transition-all"
        style={{
          backgroundColor: "var(--color-setup-card)",
          border: `1.5px solid ${isOpen ? "var(--color-setup-accent)" : "var(--color-setup-card-border)"}`,
          boxShadow: isOpen ? "0 0 0 3px var(--color-setup-accent-light)" : "0 1px 3px rgba(0,0,0,0.04)",
        }}
        onClick={() => setIsOpen(true)}
      >
        <Search
          size={18}
          strokeWidth={1.8}
          className="mr-3 shrink-0"
          style={{ color: "var(--color-setup-text-sub)" }}
        />
        <input
          type="text"
          placeholder={isDetecting ? "국가 감지 중..." : "국가를 검색하세요"}
          value={isOpen ? query : displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
          style={{ color: "var(--color-setup-text)" }}
        />
        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--color-setup-text-sub)" }}
        />
      </div>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <ul
          className="absolute top-full left-0 right-0 mt-2 max-h-56 overflow-y-auto rounded-2xl z-10"
          style={{
            backgroundColor: "var(--color-setup-card)",
            border: "1.5px solid var(--color-setup-card-border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          {showPopular ? (
            <>
              {/* 자주 쓰는 국가 섹션 */}
              <li
                className="px-4 py-2 text-[11px] uppercase tracking-wider font-medium"
                style={{ color: "var(--color-setup-text-sub)" }}
              >
                자주 쓰는 국가
              </li>
              {POPULAR_COUNTRIES.map((c) => (
                <CountryItem
                  key={c.code}
                  code={c.code}
                  name={c.name}
                  isSelected={value === c.code}
                  onSelect={handleSelect}
                />
              ))}
              {/* 구분선 */}
              <li
                className="my-1 mx-4"
                style={{ borderTop: "1px solid var(--color-setup-card-border)" }}
              />
              <li
                className="px-4 py-2 text-[11px] uppercase tracking-wider font-medium"
                style={{ color: "var(--color-setup-text-sub)" }}
              >
                전체 국가
              </li>
              {ALL_COUNTRIES.map((c) => (
                <CountryItem
                  key={c.code}
                  code={c.code}
                  name={c.name}
                  isSelected={value === c.code}
                  onSelect={handleSelect}
                />
              ))}
            </>
          ) : filtered.length > 0 ? (
            filtered.map((c) => (
              <CountryItem
                key={c.code}
                code={c.code}
                name={c.name}
                isSelected={value === c.code}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <li
              className="px-4 py-3 text-sm text-center"
              style={{ color: "var(--color-setup-text-sub)" }}
            >
              검색 결과 없음
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ── 드롭다운 항목 ── */
function CountryItem({
  code,
  name,
  isSelected,
  onSelect,
}: {
  code: string;
  name: string;
  isSelected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(code)}
        className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
        style={{
          color: isSelected ? "var(--color-setup-accent)" : "var(--color-setup-text)",
          backgroundColor: isSelected ? "var(--color-setup-accent-light)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-setup-accent-light)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span>{name}</span>
        {isSelected && <Check size={16} strokeWidth={2} />}
      </button>
    </li>
  );
}
