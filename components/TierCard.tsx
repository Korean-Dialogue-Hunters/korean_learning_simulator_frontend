"use client";

import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile, GRADE_BORDER_COLOR, GRADE_TEXT_COLOR } from "@/types/user";

interface TierCardProps {
  user: UserProfile;
}

export default function TierCard({ user }: TierCardProps) {
  const { t } = useTranslation();
  const borderColor = GRADE_BORDER_COLOR[user.grade];
  const textColor = GRADE_TEXT_COLOR[user.grade];
  const progressPercent = Math.min(Math.round((user.xp / user.xpMax) * 100), 100);

  return (
    <div className={`mx-5 rounded-2xl border ${borderColor} bg-card-bg p-5`}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-lg font-bold text-foreground block leading-tight">{user.userNickname}</span>
          <span className="text-[11px] text-tab-inactive">{t("tierCard.welcome")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface">
            <Trophy size={16} strokeWidth={1.8} className={textColor} />
          </div>
          <span className={`text-sm font-bold ${textColor}`}>{user.grade}</span>
        </div>
      </div>
      <div className="w-full h-2.5 rounded-full bg-surface-border overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, backgroundColor: gradeProgressColor(user.grade) }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-tab-inactive">
          <span className="text-foreground font-semibold">{user.xp.toLocaleString()}</span> / {user.xpMax.toLocaleString()} XP
        </span>
        <span className="text-[11px] text-tab-inactive">
          {t("tierCard.nextTier", { xp: user.xpToNext.toLocaleString() })}
        </span>
      </div>
    </div>
  );
}

function gradeProgressColor(grade: UserProfile["grade"]): string {
  const colors: Record<UserProfile["grade"], string> = {
    Bronze: "#CD7F32", Silver: "#C0C0C0", Gold: "#FFD700", Platinum: "#E5E4E2", Diamond: "#B9F2FF",
  };
  return colors[grade];
}
