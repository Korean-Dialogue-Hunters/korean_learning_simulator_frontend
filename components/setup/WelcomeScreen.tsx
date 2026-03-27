"use client";

/* ──────────────────────────────────────────
   WelcomeScreen 컴포넌트
   - 맞춤 학습 설정 진입 전 환영 화면
   - 앱 소개 + "시작하기" CTA
   ────────────────────────────────────────── */

import { Globe, MessageCircle, Sparkles } from "lucide-react";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";

interface WelcomeScreenProps {
  onStart: () => void; // "시작하기" 버튼 클릭 콜백
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      {/* 로고 / 앱 이름 영역 */}
      <div className="mb-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: WARM_THEME.accentLight }}
        >
          <MessageCircle
            size={36}
            strokeWidth={1.8}
            style={{ color: WARM_THEME.accent }}
          />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: WARM_THEME.text }}
        >
          코대헌
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: WARM_THEME.textSub }}
        >
          Korean Dialogue Hunters
        </p>
      </div>

      {/* 소개 문구 */}
      <p
        className="text-base leading-relaxed mt-6 mb-10 max-w-[280px]"
        style={{ color: WARM_THEME.text }}
      >
        실제 한국에서 쓰는 대화를
        <br />
        AI와 함께 연습해보세요
      </p>

      {/* 특징 3가지 */}
      <div className="flex flex-col gap-4 w-full max-w-[300px] mb-12">
        <FeatureRow
          icon={<Globe size={20} strokeWidth={1.8} />}
          text="내 수준에 맞는 맞춤 대화"
        />
        <FeatureRow
          icon={<MessageCircle size={20} strokeWidth={1.8} />}
          text="실제 장소 기반 시나리오"
        />
        <FeatureRow
          icon={<Sparkles size={20} strokeWidth={1.8} />}
          text="AI가 알려주는 상세 피드백"
        />
      </div>

      {/* 시작 버튼 */}
      <button
        type="button"
        onClick={onStart}
        className={`w-full max-w-[300px] ${COMMON_CLASSES.fullWidthBtn} text-white`}
        style={{ backgroundColor: WARM_THEME.accent }}
      >
        맞춤 학습 설정 시작하기
      </button>

      {/* 하단 안내 */}
      <p
        className="text-xs mt-4"
        style={{ color: WARM_THEME.textSub }}
      >
        약 1분이면 완료됩니다
      </p>
    </div>
  );
}

/* ── 특징 행 컴포넌트 ── */
function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      {/* 아이콘 원형 배경 */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: WARM_THEME.accentLight,
          color: WARM_THEME.accent,
        }}
      >
        {icon}
      </div>
      <span
        className="text-sm font-medium"
        style={{ color: WARM_THEME.text }}
      >
        {text}
      </span>
    </div>
  );
}
