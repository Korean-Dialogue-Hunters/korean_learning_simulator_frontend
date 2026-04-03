"use client";

/* ──────────────────────────────────────────
   채팅 상단 프로필 카드 (가로 반반)
   - 왼쪽: 내 페르소나(역할/미션)
   - 오른쪽: 상대 페르소나(AI)
   - 하단: 미션 설명 + 남은 턴
   ────────────────────────────────────────── */

import { Persona } from "@/types/api";


/** 상대 페르소나 정보 (BE 연동 시 메타데이터에서 받음) */
export interface CounterpartInfo {
  name: string;
  age: number;
  role: string;
  avatarUrl?: string;
}

interface PersonaProfileCardProps {
  persona: Persona;
  counterpart: CounterpartInfo;
  turnsLeft: number;
  totalTurns: number;
  scenarioTitle?: string | null;
}

export default function PersonaProfileCard({
  persona,
  counterpart,
  turnsLeft,
  totalTurns,
  scenarioTitle,
}: PersonaProfileCardProps) {
  return (
    <div
      className="rounded-2xl px-4 py-4 space-y-3"
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
      }}
    >
      {/* 가로 반반: 내 역할 | 상대방 */}
      <div className="flex gap-3">
        {/* 왼쪽: 내 역할 */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            {persona.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              persona.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-tab-inactive bg-surface px-1 py-0.5 rounded shrink-0">나</span>
              <p className="text-[13px] font-bold truncate text-foreground">{persona.name}</p>
            </div>
            <p className="text-[11px] text-tab-inactive truncate">
              {persona.age}세 · {persona.role}
            </p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-px self-stretch" style={{ backgroundColor: "var(--color-card-border)" }} />

        {/* 오른쪽: 상대방 */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-tab-inactive)",
            }}
          >
            {counterpart.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={counterpart.avatarUrl} alt={counterpart.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              counterpart.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-tab-inactive bg-surface px-1 py-0.5 rounded shrink-0">상대</span>
              <p className="text-[13px] font-bold text-foreground truncate">{counterpart.name}</p>
            </div>
            <p className="text-[11px] text-tab-inactive truncate">
              {counterpart.age}세 · {counterpart.role}
            </p>
          </div>
        </div>
      </div>

      {/* 하단: 미션 + 턴 카운터 */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] text-foreground/80 leading-snug flex-1">
          🎯 {scenarioTitle ?? persona.mission}
        </p>
        <div
          className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
            color: "var(--color-foreground)",
          }}
        >
          {turnsLeft} / {totalTurns}
        </div>
      </div>
    </div>
  );
}
