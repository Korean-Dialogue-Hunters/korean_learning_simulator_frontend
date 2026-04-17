"use client";

/* ──────────────────────────────────────────
   승급 페이지 (/level-up)
   - 현재 korean_level 벨트 + 다음 벨트 미리보기
   - 승급 조건 체크리스트 (BE-T5-02 eligibility API 연동 대기)
   - 현재는 스캐폴드만: BE가 준비되면 eligibility 조회 + 응시 버튼 활성화
   ────────────────────────────────────────── */

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Award, ChevronRight, Lock } from "lucide-react";
import { isSetupDone, getSavedProfile } from "@/hooks/useSetup";
import { getBelt } from "@/lib/belt";
import { mapKoreanLevel } from "@/lib/koreanLevel";

export default function LevelUpPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    if (!isSetupDone()) {
      router.replace("/setup");
      return;
    }
    const profile = getSavedProfile();
    if (!profile) return;
    /* BE가 user_profile.korean_level 정수 제공 전까지는 셋업 문자열 매핑 사용 */
    setCurrentLevel(mapKoreanLevel(profile.koreanLevel));
  }, [router]);

  const currentBelt = getBelt(currentLevel);
  const nextLevel = Math.min(currentLevel + 1, 6);
  const nextBelt = getBelt(nextLevel);
  const isMaxLevel = currentLevel >= 6;

  const isKo = i18n.language?.startsWith("ko");
  const currentBeltLabel = isKo ? `${currentBelt.nameKo}띠` : `${currentBelt.name} Belt`;
  const nextBeltLabel = isKo ? `${nextBelt.nameKo}띠` : `${nextBelt.name} Belt`;

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <h1 className="text-xl font-bold text-foreground mb-1">{t("levelUp.title")}</h1>
      <p className="text-[12px] text-tab-inactive mb-5">{t("levelUp.subtitle")}</p>

      {/* 현재 → 다음 벨트 비교 카드 */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <div className="flex items-center justify-between">
          {/* 현재 벨트 */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-tab-inactive mb-2">{t("levelUp.currentLevel")}</span>
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-2"
              style={{ border: `2px solid ${currentBelt.color}`, backgroundColor: "var(--color-surface)" }}
            >
              <Image src={currentBelt.image} alt={currentBelt.name} width={44} height={44} />
            </div>
            <span className="text-[12px] font-bold" style={{ color: currentBelt.color }}>
              {currentBeltLabel}
            </span>
          </div>

          {/* 화살표 */}
          <ChevronRight size={24} className="text-tab-inactive shrink-0 mx-2" />

          {/* 다음 벨트 */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-tab-inactive mb-2">{t("levelUp.nextLevel")}</span>
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-2 relative"
              style={{
                border: `2px dashed ${nextBelt.color}`,
                backgroundColor: "var(--color-surface)",
                opacity: isMaxLevel ? 0.35 : 0.7,
              }}
            >
              <Image src={nextBelt.image} alt={nextBelt.name} width={44} height={44} />
            </div>
            <span className="text-[12px] font-bold" style={{ color: nextBelt.color, opacity: isMaxLevel ? 0.5 : 1 }}>
              {isMaxLevel ? t("levelUp.maxLevel") : nextBeltLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 승급 조건 */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <p className="text-[13px] font-bold text-foreground mb-3">{t("levelUp.requirementsTitle")}</p>
        <ul className="flex flex-col gap-2">
          <li className="flex items-start gap-2 text-[12px] text-tab-inactive">
            <span className="text-accent mt-[1px]">·</span>
            <span>{t("levelUp.reqSessions")}</span>
          </li>
          <li className="flex items-start gap-2 text-[12px] text-tab-inactive">
            <span className="text-accent mt-[1px]">·</span>
            <span>{t("levelUp.reqScore")}</span>
          </li>
          <li className="flex items-start gap-2 text-[12px] text-tab-inactive">
            <span className="text-accent mt-[1px]">·</span>
            <span>{t("levelUp.reqExam")}</span>
          </li>
        </ul>
      </div>

      {/* 응시 버튼 (BE 준비 중 → 비활성) */}
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px]"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-tab-inactive)",
          border: "1px solid var(--color-card-border)",
          cursor: "not-allowed",
        }}
      >
        <Lock size={16} strokeWidth={2.2} />
        {isMaxLevel ? t("levelUp.maxLevelNote") : t("levelUp.comingSoon")}
      </button>

      {/* 안내 문구 */}
      <p className="text-[11px] text-center text-tab-inactive mt-3 leading-relaxed">
        <Award size={12} className="inline-block mr-1 mb-[2px]" />
        {t("levelUp.systemNote")}
      </p>
    </div>
  );
}
