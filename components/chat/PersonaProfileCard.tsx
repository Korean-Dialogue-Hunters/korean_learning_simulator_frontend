"use client";

/* ──────────────────────────────────────────
   채팅 상단 프로필 카드 (가로 반반)
   - 왼쪽: 내 페르소나(역할/미션)
   - 오른쪽: 상대 페르소나(AI)
   - 하단: 미션 설명 + 남은 턴
   ────────────────────────────────────────── */

import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import { Persona } from "@/types/api";
import { titleCase } from "@/lib/textCase";


/** 상대 페르소나 정보 (BE 연동 시 메타데이터에서 받음) */
export interface CounterpartInfo {
  name: string;
  age: number;
  gender?: string;
  genderEn?: string;
  role: string;
  roleEn?: string;
  personaUrl?: string;
}

interface PersonaProfileCardProps {
  persona: Persona;
  counterpart: CounterpartInfo;
}

export default function PersonaProfileCard({
  persona,
  counterpart,
}: PersonaProfileCardProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const myRole = titleCase((isEn && persona.roleEn) || persona.role);
  const myGender = (isEn && persona.genderEn) || persona.gender;
  const myMission = (isEn && persona.missionEn) || persona.mission;
  const cpRole = titleCase((isEn && counterpart.roleEn) || counterpart.role);
  const cpGender = (isEn && counterpart.genderEn) || counterpart.gender;

  return (
    <div
      className="rounded-2xl px-4 py-4"
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
            {persona.personaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={persona.personaUrl} alt={persona.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              persona.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-tab-inactive bg-surface px-1 py-0.5 rounded shrink-0">{t("chat.me")}</span>
              <p className="text-[13px] font-bold truncate text-foreground">{persona.name}</p>
            </div>
            <p className="text-[11px] text-tab-inactive">
              {persona.age} · {myGender}
            </p>
            <p className="text-[11px] text-tab-inactive">
              {myRole}
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
            {counterpart.personaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={counterpart.personaUrl} alt={counterpart.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              counterpart.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-tab-inactive bg-surface px-1 py-0.5 rounded shrink-0">{t("chat.partner")}</span>
              <p className="text-[13px] font-bold text-foreground truncate">{counterpart.name}</p>
            </div>
            <p className="text-[11px] text-tab-inactive">
              {counterpart.age}{cpGender ? ` · ${cpGender}` : ""}
            </p>
            <p className="text-[11px] text-tab-inactive">
              {cpRole}
            </p>
          </div>
        </div>
      </div>

      {/* 하단: 미션 */}
      <div
        className="mt-3 pt-3"
        style={{ borderTop: "1px solid var(--color-card-border)" }}
      >
        <p className="text-[12px] text-foreground/80 leading-snug flex items-start gap-1">
          <Flag size={12} strokeWidth={2} className="shrink-0 mt-0.5" />
          <span>{t("chat.missionLabel")}: {myMission}</span>
        </p>
      </div>
    </div>
  );
}
