"use client";

/* ──────────────────────────────────────────
   BeltGuideModal — 승급 탭의 "띠 등급 안내" 모달
   - 트리거: /level-up 벨트 비교 카드 우상단의 HelpCircle 버튼
   - 내용: 6개 벨트 (노랑→검정)를 레벨/색/이미지/설명과 함께 나열
   - 현재 유저 레벨 행은 테두리·배지로 강조
   ────────────────────────────────────────── */

import Image from "next/image";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { getBelt } from "@/lib/belt";

interface BeltGuideModalProps {
  open: boolean;
  onClose: () => void;
  currentLevel: number;
}

export default function BeltGuideModal({ open, onClose, currentLevel }: BeltGuideModalProps) {
  const { t, i18n } = useTranslation();
  const isKo = i18n.language?.startsWith("ko");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const belts = [1, 2, 3, 4, 5, 6].map((lv) => ({
    ...getBelt(lv),
    label: isKo ? `${getBelt(lv).nameKo}띠` : `${getBelt(lv).name} Belt`,
    desc: t(`levelUp.beltGuide.level${lv}.desc`),
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-label={t("levelUp.beltGuide.title")}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85dvh] flex flex-col"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-card-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex-1 pr-3">
            <h2 className="text-lg font-bold text-foreground">{t("levelUp.beltGuide.title")}</h2>
            <p className="text-[12px] text-tab-inactive leading-relaxed mt-1 whitespace-nowrap">
              {t("levelUp.beltGuide.lead")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("levelUp.beltGuide.close")}
            className="text-tab-inactive active:scale-95 transition-transform shrink-0"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* 벨트 리스트 */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          <ul className="flex flex-col gap-2">
            {belts.map((b) => {
              const isCurrent = b.level === currentLevel;
              return (
                <li
                  key={b.level}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: "var(--color-card-bg)",
                    border: isCurrent
                      ? `1.5px solid ${b.color}`
                      : "1px solid var(--color-card-border)",
                  }}
                >
                  {/* 벨트 이미지 */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: `1px solid ${b.color}44`,
                    }}
                  >
                    <Image src={b.image} alt={b.name} width={28} height={28} />
                  </div>

                  {/* 라벨 + 설명 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[13px] font-bold" style={{ color: b.color }}>
                        {b.label}
                      </span>
                      <span className="text-[11px] text-tab-inactive font-medium">
                        {t("levelUp.beltGuide.levelLabel", { level: b.level })}
                      </span>
                      {isCurrent && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-[1px] rounded-full ml-0.5"
                          style={{
                            backgroundColor: b.color,
                            color: "#fff",
                          }}
                        >
                          {t("levelUp.beltGuide.currentBadge")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-foreground/80 leading-snug">{b.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 푸터 안내 */}
        <div
          className="px-5 py-3.5"
          style={{ borderTop: "1px solid var(--color-card-border)" }}
        >
          <p className="text-[11px] text-tab-inactive leading-relaxed">
            💡 {t("levelUp.beltGuide.note")}
          </p>
        </div>
      </div>
    </div>
  );
}
