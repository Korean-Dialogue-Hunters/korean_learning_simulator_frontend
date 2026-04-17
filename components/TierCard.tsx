"use client";

/* ──────────────────────────────────────────
   TierCard — 홈 상단 유저 카드
   - 닉네임 + 태권도 벨트(korean level) + XP 진행 바
   ────────────────────────────────────────── */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { UserProfile } from "@/types/user";
import { getBelt } from "@/lib/belt";

interface TierCardProps {
  user: UserProfile;
}

export default function TierCard({ user }: TierCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const belt = getBelt(user.koreanLevel);
  const progressPercent = Math.min(Math.round((user.xp / user.xpMax) * 100), 100);

  return (
    <div className="mx-5 rounded-2xl bg-card-bg p-5"
      style={{ border: `2px solid ${belt.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* 상단: 닉네임 + 벨트 아이콘 (벨트 클릭 → /level-up) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-foreground">{user.userNickname}</span>
          <span className="text-[11px] text-tab-inactive">{t("tierCard.namePostfix")}</span>
        </div>
        {/* 벨트 아이콘 + 이름 — 누르면 승급 탭으로 이동 */}
        <button
          type="button"
          onClick={() => router.push("/level-up")}
          aria-label={t("levelUp.title")}
          className="flex items-center gap-2 active:scale-[0.96] transition-transform"
        >
          <span className="text-[11px] font-medium" style={{ color: belt.color }}>
            {i18n.language?.startsWith("ko") ? `${belt.nameKo}띠` : `${belt.name} Belt`}
          </span>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ border: `1.5px solid ${belt.color}`, backgroundColor: "var(--color-surface)" }}>
            <Image src={belt.image} alt={belt.name} width={28} height={28} />
          </div>
        </button>
      </div>
      {/* XP 진행 바 */}
      <div className="w-full h-2.5 rounded-full bg-surface-border overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, backgroundColor: belt.color }} />
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
