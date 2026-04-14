"use client";

import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile, GRADE_COLORS } from "@/types/user";

interface TierCardProps {
  user: UserProfile;
}

export default function TierCard({ user }: TierCardProps) {
  const { t } = useTranslation();
  const gradeColor = GRADE_COLORS[user.grade] ?? "var(--color-accent)";
  const progressPercent = Math.min(Math.round((user.xp / user.xpMax) * 100), 100);

  return (
    <div className="mx-5 rounded-2xl bg-card-bg p-5"
      style={{ border: `2px solid ${gradeColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="leading-tight">
            <span className="text-lg font-bold text-foreground">{user.userNickname}</span>
            <span className="text-[11px] text-tab-inactive ml-1">{t("tierCard.namePostfix")}</span>
          </div>
          <span className="text-[11px] text-tab-inactive">{t("tierCard.welcome")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface">
            <Trophy size={16} strokeWidth={1.8} style={{ color: gradeColor }} />
          </div>
          <span className="text-sm font-bold" style={{ color: gradeColor }}>{user.grade}</span>
        </div>
      </div>
      <div className="w-full h-2.5 rounded-full bg-surface-border overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, backgroundColor: gradeColor }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-tab-inactive">
          <span className="text-foreground font-semibold">Lv. {user.level}</span>
          {" · "}
          {user.xp.toLocaleString()} / {user.xpMax.toLocaleString()} XP
        </span>
        <span className="text-[11px] text-tab-inactive">
          {t("xp.nextLevel", { xp: user.xpToNext.toLocaleString() })}
        </span>
      </div>
    </div>
  );
}
