"use client";

/* ──────────────────────────────────────────
   XP 획득 팝업
   - "+XX XP" 표시
   - XP 바 차오르는 애니메이션
   - 레벨업 시 축하 연출
   ────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Star, Sparkles } from "lucide-react";
import { getXpBarInfo } from "@/lib/xpSystem";

export interface XpGainPopupProps {
  xpGained: number;
  prevTotalXp: number;
  newTotalXp: number;
  prevLevel: number;
  newLevel: number;
  onClose: () => void;
}

export default function XpGainPopup({
  xpGained,
  prevTotalXp,
  newTotalXp,
  prevLevel,
  newLevel,
  onClose,
}: XpGainPopupProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"filling" | "levelUp" | "done">("filling");
  const [barPercent, setBarPercent] = useState(0);
  const [visible, setVisible] = useState(false);

  const didLevelUp = newLevel > prevLevel;
  const barInfo = getXpBarInfo(newTotalXp);

  const prevBarInfo = getXpBarInfo(prevTotalXp);

  /* 진입 애니메이션 */
  useEffect(() => {
    setBarPercent(prevBarInfo.progressPercent);
    const showTimer = setTimeout(() => setVisible(true), 50);
    const fillTimer = setTimeout(() => {
      setBarPercent(didLevelUp ? 100 : barInfo.progressPercent);
    }, 300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fillTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 레벨업 감지 → 바 리셋 후 새 레벨 바 채우기 */
  useEffect(() => {
    if (!didLevelUp) return;

    const levelUpTimer = setTimeout(() => {
      setPhase("levelUp");
      setBarPercent(0);
    }, 1200);

    const refillTimer = setTimeout(() => {
      setBarPercent(barInfo.progressPercent);
    }, 1600);

    return () => {
      clearTimeout(levelUpTimer);
      clearTimeout(refillTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didLevelUp]);

  /* 자동 닫기 */
  useEffect(() => {
    const delay = didLevelUp ? 4500 : 2500;
    const timer = setTimeout(() => {
      setPhase("done");
      setVisible(false);
      setTimeout(onClose, 300);
    }, delay);
    return () => clearTimeout(timer);
  }, [didLevelUp, onClose]);

  const handleTap = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const displayLevel = phase === "levelUp" ? newLevel : prevLevel;
  const displayBarInfo = phase === "levelUp" ? barInfo : prevBarInfo;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      onClick={handleTap}
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* 팝업 카드 */}
      <div
        className="relative w-full max-w-[320px] rounded-2xl p-6 text-center transition-all duration-300"
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* 레벨업 축하 */}
        {phase === "levelUp" && (
          <div className="mb-4 animate-bounce">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles size={20} strokeWidth={2} style={{ color: "var(--color-accent)" }} className="animate-spin" />
              <span className="text-lg font-black" style={{ color: "var(--color-accent)" }}>
                {t("xp.levelUp")}
              </span>
              <Sparkles size={20} strokeWidth={2} style={{ color: "var(--color-accent)" }} className="animate-spin" />
            </div>
            <p className="text-2xl font-black text-foreground">
              Lv. {newLevel}
            </p>
          </div>
        )}

        {/* +XP 표시 */}
        {phase !== "levelUp" && (
          <div className="mb-5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={20} fill="var(--color-accent)" color="var(--color-accent)" />
              <span className="text-2xl font-black" style={{ color: "var(--color-accent)" }}>
                +{xpGained} XP
              </span>
            </div>
          </div>
        )}

        {/* XP 바 */}
        <div className="mb-2">
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface-border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${barPercent}%`,
                backgroundColor: "var(--color-accent)",
                transition: "width 0.8s ease-out",
              }}
            />
          </div>
        </div>

        {/* 레벨 + XP 수치 */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-foreground">
            Lv. {displayLevel}
          </span>
          <span className="text-tab-inactive">
            {displayBarInfo.currentLevelXp} / {displayBarInfo.requiredLevelXp} XP
          </span>
        </div>
      </div>
    </div>
  );
}
