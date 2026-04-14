"use client";

/* ──────────────────────────────────────────
   StartConfirmModal — 셋업 마지막 단계 후 표시
   - "지금 바로 대화 시작?" 일반 질문
   - 네: /location 으로 이동
   - 아니오: / (홈)
   ────────────────────────────────────────── */

import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";

interface StartConfirmModalProps {
  onYes: () => void;
  onNo: () => void;
}

export default function StartConfirmModal({ onYes, onNo }: StartConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-[480px] rounded-t-3xl px-6 pt-6 pb-10"
        style={{ backgroundColor: WARM_THEME.card, borderTop: `1.5px solid ${WARM_THEME.cardBorder}` }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: WARM_THEME.dotInactive }} />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: WARM_THEME.accentLight, color: WARM_THEME.accent }}>
          <MessageCircle size={26} strokeWidth={1.8} />
        </div>
        <h2 className="text-base font-bold text-center mb-1" style={{ color: WARM_THEME.text }}>
          {t("startConfirm.title")}
        </h2>
        <p className="text-xs text-center mb-7" style={{ color: WARM_THEME.textSub }}>
          {t("startConfirm.subText")}
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={onYes}
            className={`w-full py-3.5 ${COMMON_CLASSES.btnRounded} font-bold text-sm text-white ${COMMON_CLASSES.pressEffect} transition-transform`}
            style={{ backgroundColor: WARM_THEME.accent }}>
            {t("startConfirm.yes")}
          </button>
          <button type="button" onClick={onNo}
            className={`w-full py-3.5 ${COMMON_CLASSES.btnRounded} text-sm font-medium ${COMMON_CLASSES.pressEffect} transition-transform`}
            style={{ backgroundColor: WARM_THEME.bg, color: WARM_THEME.text, border: `1.5px solid ${WARM_THEME.cardBorder}` }}>
            {t("startConfirm.no")}
          </button>
        </div>
      </div>
    </div>
  );
}
