"use client";

import { MessageCircle, Star, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WeeklyStats as WeeklyStatsType } from "@/types/user";

interface WeeklyStatsProps {
  stats: WeeklyStatsType;
}

export default function WeeklyStats({ stats }: WeeklyStatsProps) {
  const { t } = useTranslation();
  return (
    <div className="mx-5 grid grid-cols-3 gap-2.5">
      <StatBox
        icon={<MessageCircle size={18} strokeWidth={1.8} />}
        label={t("weeklyStats.conversationCount")}
        value={t("weeklyStats.countValue", { count: stats.conversationCount })}
        highlight={false}
      />
      <StatBox
        icon={<Star size={18} strokeWidth={1.8} fill="var(--color-accent)" color="var(--color-accent)" />}
        label={t("weeklyStats.averageScore")}
        value={t("weeklyStats.scoreValue", { score: stats.averageScore.toFixed(1) })}
        highlight={false}
      />
      <div className="relative pointer-events-none select-none">
        <div className="blur-[3px]">
          <StatBox
            icon={<Flame size={18} strokeWidth={1.8} />}
            label={t("weeklyStats.streak")}
            value={t("weeklyStats.streakValue", { days: stats.streakDays })}
            highlight={true}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🚧</span>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-card-bg border border-card-border py-3.5 px-2"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className={`mb-1.5 ${highlight ? "text-red-400" : "text-tab-inactive"}`}>{icon}</div>
      <span className={`text-lg font-bold ${highlight ? "text-red-400" : "text-foreground"}`}>{value}</span>
      <span className="text-[10px] text-tab-inactive mt-0.5">{label}</span>
    </div>
  );
}
