"use client";

/* ──────────────────────────────────────────
   HomeHeader 컴포넌트
   - 좌측: KDH 로고 이미지 + 코대헌 서브라벨
   - 우측: 톱니바퀴(설정) — 언어/테마 토글은 /settings로 이동
   ────────────────────────────────────────── */

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";
import { WARM_THEME } from "@/lib/designSystem";

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      {/* 좌측: 앱 타이틀 (로고 + 서브라벨) */}
      <div className="flex flex-col items-start">
        <Image
          src="/brand/kdh_logo.png"
          alt="Korean Dialogue Hunters"
          width={160}
          height={106}
          priority
          className="h-auto w-[140px]"
        />
        <p className="text-[11px] font-semibold text-tab-inactive tracking-wide mt-1">코대헌</p>
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
