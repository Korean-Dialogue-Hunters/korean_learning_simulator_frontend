"use client";

/* ──────────────────────────────────────────
   QuickStartModal 컴포넌트 (따뜻한 무드 리디자인)
   - 맞춤 학습 설정 완료 후 "바로 대화를 시작할까요?" 팝업
   - YES → 시나리오 생성 API 호출 → /persona 이동
   - NO  → 홈(/)으로 이동 + 튜토리얼 플래그 초기화
   ────────────────────────────────────────── */

import { MapPin } from "lucide-react";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";

interface QuickStartModalProps {
  locationLabel: string;
  onYes: () => void;
  onNo: () => void;
}

export default function QuickStartModal({
  locationLabel,
  onYes,
  onNo,
}: QuickStartModalProps) {
  return (
    /* 반투명 배경 오버레이 */
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      {/* 팝업 카드 (하단 시트 스타일) */}
      <div
        className="w-full max-w-[480px] rounded-t-3xl px-6 pt-6 pb-10"
        style={{
          backgroundColor: WARM_THEME.card,
          borderTop: `1.5px solid ${WARM_THEME.cardBorder}`,
        }}
      >
        {/* 상단 핸들 바 */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-6"
          style={{ backgroundColor: WARM_THEME.dotInactive }}
        />

        {/* 아이콘 */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            backgroundColor: WARM_THEME.accentLight,
            color: WARM_THEME.accent,
          }}
        >
          <MapPin size={26} strokeWidth={1.8} />
        </div>

        {/* 질문 텍스트 */}
        <h2
          className="text-base font-bold text-center mb-1"
          style={{ color: WARM_THEME.text }}
        >
          {locationLabel}(으)로 바로 시작할까요?
        </h2>
        <p
          className="text-xs text-center mb-7"
          style={{ color: WARM_THEME.textSub }}
        >
          지금 시작하거나, 나중에 홈에서 시작할 수 있어요.
        </p>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-3">
          {/* YES 버튼 */}
          <button
            type="button"
            onClick={onYes}
            className={`w-full py-3.5 ${COMMON_CLASSES.btnRounded} font-bold text-sm text-white ${COMMON_CLASSES.pressEffect} transition-transform`}
            style={{ backgroundColor: WARM_THEME.accent }}
          >
            네, 지금 시작할게요!
          </button>

          {/* NO 버튼 */}
          <button
            type="button"
            onClick={onNo}
            className={`w-full py-3.5 ${COMMON_CLASSES.btnRounded} text-sm font-medium ${COMMON_CLASSES.pressEffect} transition-transform`}
            style={{
              backgroundColor: WARM_THEME.bg,
              color: WARM_THEME.text,
              border: `1.5px solid ${WARM_THEME.cardBorder}`,
            }}
          >
            아니요, 나중에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
