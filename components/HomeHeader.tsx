"use client";

/* ──────────────────────────────────────────
   HomeHeader 컴포넌트
   - 좌측: 앱 이름 "코대헌" + 영문 서브타이틀
   - 우측: 테마 토글(Sun/Moon) + 프로필 원형 아이콘 + @유저ID
   - 티어값에 따라 프로필 테두리 색상이 달라짐
   ────────────────────────────────────────── */

import { Sun, Moon } from "lucide-react";
import { UserProfile, GRADE_BORDER_COLOR } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";

interface HomeHeaderProps {
  user: UserProfile;
}

export default function HomeHeader({ user }: HomeHeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  // 티어에 맞는 테두리 색상 클래스
  const borderColor = GRADE_BORDER_COLOR[user.grade];

  // 유저 닉네임 첫 글자를 이니셜로 표시
  const initial = user.user_nickname.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      {/* 좌측: 앱 타이틀 */}
      <div>
        <h1 className="text-2xl font-extrabold text-gold leading-tight">코대헌</h1>
        <p className="text-[11px] text-tab-inactive tracking-wide">
          Korean Dialogue Hunters
        </p>
      </div>

      {/* 우측: 테마 토글 + 프로필 영역 */}
      <div className="flex items-center gap-3">
        {/* 테마 토글 버튼 */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="테마 전환"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface border border-surface-border text-tab-inactive hover:text-foreground transition-colors"
        >
          {isDark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
        </button>

        {/* 프로필 영역 */}
        <div className="flex flex-col items-center gap-1">
          {/* 원형 프로필 아이콘 */}
          <div
            className={`w-10 h-10 rounded-full border-2 ${borderColor} flex items-center justify-center overflow-hidden bg-surface`}
          >
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={`${user.user_nickname} 프로필`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-foreground">{initial}</span>
            )}
          </div>
          {/* @유저ID */}
          <span className="text-[10px] text-tab-inactive">@{user.user_nickname}</span>
        </div>
      </div>
    </header>
  );
}
