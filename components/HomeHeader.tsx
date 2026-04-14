"use client";

/* ──────────────────────────────────────────
   HomeHeader 컴포넌트
   - 좌측: 앱 이름 "코대헌" + 영문 서브타이틀
   - 우측: 톱니바퀴(설정) — 언어/테마 토글은 /settings로 이동
   ────────────────────────────────────────── */

import Link from "next/link";
import { Settings } from "lucide-react";
import { WARM_THEME } from "@/lib/designSystem";

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      {/* 좌측: 앱 타이틀 */}
      <div>
        <h1 className="text-2xl font-extrabold text-gold leading-tight">코대헌</h1>
        <p className="text-[11px] text-tab-inactive tracking-wide">
          Korean Dialogue Hunters
        </p>
      </div>
      {/* 우측: 설정 진입 */}
      <Link
        href="/settings"
        aria-label="settings"
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{
          backgroundColor: WARM_THEME.accentLight,
          color: WARM_THEME.accent,
          border: `1.5px solid ${WARM_THEME.accent}`,
        }}
      >
        <Settings size={20} strokeWidth={1.8} />
      </Link>
    </header>
  );
}
