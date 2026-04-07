"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { WARM_THEME } from "@/lib/designSystem";

const LANGUAGES = [
  { code: "ko", label: "한국어 - Korean" },
  { code: "en", label: "영어 - English" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const currentLang = i18n.language?.startsWith("ko") ? "ko" : "en";

  /* 외부 클릭 시 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 h-10 px-2.5 rounded-xl transition-colors"
        style={{
          backgroundColor: WARM_THEME.accentLight,
          color: WARM_THEME.accent,
          border: `1.5px solid ${WARM_THEME.accent}`,
          fontSize: "11px",
          fontWeight: 700,
          minWidth: 44,
        }}
      >
        <span>{mounted ? (currentLang === "ko" ? "한" : "EN") : "한"}</span>
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          className="absolute right-0 top-12 rounded-2xl overflow-hidden shadow-lg z-50"
          style={{
            backgroundColor: WARM_THEME.card,
            border: `1.5px solid ${WARM_THEME.cardBorder}`,
            minWidth: 160,
          }}
        >
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:opacity-80"
                style={{
                  backgroundColor: isSelected
                    ? WARM_THEME.accentLight
                    : "transparent",
                  color: isSelected ? WARM_THEME.accent : WARM_THEME.text,
                  fontSize: "13px",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span>{lang.label}</span>
                {isSelected && (
                  <Check size={14} strokeWidth={2.5} style={{ color: WARM_THEME.accent }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
