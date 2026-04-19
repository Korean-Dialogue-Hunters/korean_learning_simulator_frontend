"use client";

/* ──────────────────────────────────────────
   TierCard — 홈 상단 유저 카드
   - 닉네임 + 태권도 벨트(korean level) + XP 진행 바
   - XP 진행바는 테마 accent 고정(벨트 색과 분리)
   - 배경 틴트/글로우로 벨트 색 시각화
   ────────────────────────────────────────── */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { UserProfile } from "@/types/user";
import { getBelt } from "@/lib/belt";
import { useExamEligibility } from "@/hooks/useExamEligibility";

interface TierCardProps {
  user: UserProfile;
}

export default function TierCard({ user }: TierCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const belt = getBelt(user.koreanLevel);
  const progressPercent = Math.min(Math.round((user.xp / user.xpMax) * 100), 100);
  const examEligible = useExamEligibility();

  return (
    <div
      className="mx-5 rounded-2xl p-5"
      style={{
        border: `2px solid ${belt.color}`,
        background: `color-mix(in srgb, ${belt.color} 7%, var(--color-card-bg))`,
        boxShadow: `0 4px 16px color-mix(in srgb, ${belt.color} 18%, transparent)`,
      }}
    >
      {/* 상단: 닉네임 + 벨트 아이콘 (벨트 클릭 → /level-up) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-foreground">{user.userNickname}</span>
        </div>
        {/* 벨트 아이콘 + 이름 — 누르면 승급 탭으로 이동
            승급 응시 가능 상태면 벨트 박스에 pulse glow + 빨간 ! 배지 */}
        <button
          type="button"
          onClick={() => router.push("/level-up")}
          aria-label={t("levelUp.title")}
          className="flex items-center gap-2 active:scale-[0.96] transition-transform"
        >
          <span className="text-[11px] font-medium" style={{ color: belt.color }}>
            {i18n.language?.startsWith("ko") ? `${belt.nameKo}띠` : `${belt.name} Belt`}
          </span>
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${examEligible ? "animate-pulse" : ""}`}
              style={{
                border: `1.5px solid ${belt.color}`,
                backgroundColor: "var(--color-surface)",
                boxShadow: examEligible ? `0 0 0 3px color-mix(in srgb, ${belt.color} 35%, transparent)` : undefined,
              }}
            >
              <Image src={belt.image} alt={belt.name} width={28} height={28} />
            </div>
            {examEligible && (
              <span
                aria-hidden
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "#DC3C3C", boxShadow: "0 0 0 2px var(--color-card-bg)" }}
              >
                !
              </span>
            )}
          </div>
        </button>
      </div>
      {/* XP 진행 바 — 테마 accent 색 고정 */}
      <div className="w-full h-2.5 rounded-full bg-surface-border overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, backgroundColor: "var(--color-accent)" }} />
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
