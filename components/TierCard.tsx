"use client";

/* ──────────────────────────────────────────
   TierCard 컴포넌트
   - 현재 티어명 / 등급 표시
   - XP 현재값 · 최대값 / 진행 바
   - 다음 티어까지 남은 XP 표시
   ────────────────────────────────────────── */

import { Trophy } from "lucide-react";
import { UserProfile, GRADE_BORDER_COLOR, GRADE_TEXT_COLOR } from "@/types/user";

interface TierCardProps {
  user: UserProfile;
}

export default function TierCard({ user }: TierCardProps) {
  const borderColor = GRADE_BORDER_COLOR[user.grade];
  const textColor = GRADE_TEXT_COLOR[user.grade];

  const progressPercent = Math.min(
    Math.round((user.xp / user.xpMax) * 100),
    100
  );

  return (
    <div className={`mx-5 rounded-2xl border ${borderColor} bg-card-bg p-5`}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {/* 상단: 티어명 + XP */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {/* 트로피 아이콘 */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-surface`}>
            <Trophy size={18} strokeWidth={1.8} className={textColor} />
          </div>
          <div>
            <span className={`text-lg font-bold ${textColor} block leading-tight`}>{user.grade}</span>
            <span className="text-[11px] text-tab-inactive">현재 등급</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-foreground block">
            {user.xp.toLocaleString()}
          </span>
          <span className="text-[11px] text-tab-inactive">
            / {user.xpMax.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* XP 진행 바 */}
      <div className="w-full h-2.5 rounded-full bg-surface-border overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: gradeProgressColor(user.grade),
          }}
        />
      </div>

      {/* 하단: 남은 XP */}
      <p className="text-[11px] text-tab-inactive text-right">
        다음 티어까지{" "}
        <span className="text-foreground font-semibold">
          {user.xpToNext.toLocaleString()} XP
        </span>{" "}
        남음
      </p>
    </div>
  );
}

/* 티어별 진행 바 색상 */
function gradeProgressColor(grade: UserProfile["grade"]): string {
  const colors: Record<UserProfile["grade"], string> = {
    Bronze: "#CD7F32",
    Silver: "#C0C0C0",
    Gold: "#FFD700",
    Platinum: "#E5E4E2",
    Diamond: "#B9F2FF",
  };
  return colors[grade];
}
