"use client";

/* ──────────────────────────────────────────
   ThemeToggle 컴포넌트
   - 모든 화면 우상단 고정 위치에 표시되는 다크/라이트 전환 버튼
   - layout.tsx에서 한 번만 렌더링
   ────────────────────────────────────────── */

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { WARM_THEME } from "@/lib/designSystem";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
      style={{
        backgroundColor: WARM_THEME.accentLight,
        color: WARM_THEME.accent,
        border: `1.5px solid ${WARM_THEME.accent}`,
      }}
    >
      {isDark ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
    </button>
  );
}
