"use client";

/* ──────────────────────────────────────────
   WeeklyStats 컴포넌트
   - 대화 수 / 평균 점수 / 연속 학습일(스트릭) 3칸 가로 배열
   - 각 카드에 lucide 아이콘 적용
   - 스트릭은 강조 색상
   ────────────────────────────────────────── */

import { MessageCircle, Star, Flame } from "lucide-react";
import { WeeklyStats as WeeklyStatsType } from "@/types/user";

interface WeeklyStatsProps {
  stats: WeeklyStatsType;
}

export default function WeeklyStats({ stats }: WeeklyStatsProps) {
  return (
    <div className="mx-5 grid grid-cols-3 gap-2.5">
      <StatBox
        icon={<MessageCircle size={18} strokeWidth={1.8} />}
        label="대화"
        value={`${stats.conversationCount}회`}
        highlight={false}
      />
      <StatBox
        icon={<Star size={18} strokeWidth={1.8} />}
        label="평균 점수"
        value={`${stats.averageScore.toFixed(1)}점`}
        highlight={false}
      />
      <StatBox
        icon={<Flame size={18} strokeWidth={1.8} />}
        label="스트릭"
        value={`${stats.streakDays}일`}
        highlight={true}
      />
    </div>
  );
}

/* ── 통계 카드 단위 컴포넌트 ── */
function StatBox({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl bg-card-bg border border-card-border py-3.5 px-2"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* 아이콘 */}
      <div className={`mb-1.5 ${highlight ? "text-red-400" : "text-tab-inactive"}`}>
        {icon}
      </div>
      {/* 값 */}
      <span className={`text-lg font-bold ${highlight ? "text-red-400" : "text-foreground"}`}>
        {value}
      </span>
      {/* 라벨 */}
      <span className="text-[10px] text-tab-inactive mt-0.5">{label}</span>
    </div>
  );
}
