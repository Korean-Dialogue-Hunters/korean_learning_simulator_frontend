"use client";

/* ──────────────────────────────────────────
   TutorialOverlay 컴포넌트
   - SVG mask로 여러 요소 동시 하이라이트
   - 흩어진 말풍선 제거 → 하단 통합 패널 1개
   - 하단 패널: 스텝 제목 + 각 메시지 목록 + 다음 버튼
   ────────────────────────────────────────── */

import { useEffect, useState, useCallback } from "react";
import { TutorialStep } from "@/hooks/useTutorial";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

const PADDING = 10;

export default function TutorialOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  isLastStep,
}: TutorialOverlayProps) {
  const [rects, setRects] = useState<(TargetRect | null)[]>([]);

  const measureTargets = useCallback(() => {
    const measured = step.targets.map((t) => {
      const el = document.getElementById(t.targetId);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    });
    setRects(measured);
  }, [step.targets]);

  useEffect(() => {
    measureTargets();
    window.addEventListener("resize", measureTargets);
    return () => window.removeEventListener("resize", measureTargets);
  }, [measureTargets]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 480;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  /* ── SVG mask: 타겟들만 구멍 뚫린 어두운 오버레이 ── */
  const renderSvgOverlay = () => (
    <svg
      className="fixed inset-0 z-40 pointer-events-none"
      width="100%"
      height="100%"
      style={{ position: "fixed", top: 0, left: 0, width: vw, height: vh }}
    >
      <defs>
        <mask id="tutorial-mask">
          {/* 전체 흰색 = 오버레이 보임 */}
          <rect width={vw} height={vh} fill="white" />
          {/* 타겟 영역 검정 = 그 부분만 투명(구멍) */}
          {rects.map((rect, i) => {
            if (!rect) return null;
            return (
              <rect
                key={i}
                x={rect.left - PADDING}
                y={rect.top - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx={14}
                fill="black"
              />
            );
          })}
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(0,0,0,0.75)"
        mask="url(#tutorial-mask)"
      />
    </svg>
  );

  /* ── 타겟 강조 테두리 ── */
  const renderHighlights = () =>
    rects.map((rect, i) => {
      if (!rect) return null;
      return (
        <div
          key={i}
          className="fixed z-50 rounded-[14px] border-2 border-orange pointer-events-none"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      );
    });

  return (
    <>
      {renderSvgOverlay()}
      {renderHighlights()}

      {/* 상단: 건너뛰기 버튼만 */}
      <div className="fixed top-5 right-4 z-50">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-white/70 bg-black/60 px-3 py-1.5 rounded-full hover:text-white transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* 하단 통합 패널 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-4 pb-6">
        <div className="rounded-2xl bg-card-bg border border-card-border shadow-2xl overflow-hidden">

          {/* 패널 헤더: 점 인디케이터 + 스텝 제목 */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-card-border">
            <div className="flex items-center gap-2">
              {/* 점 인디케이터 */}
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-4 h-1.5 bg-orange"
                        : "w-1.5 h-1.5 bg-surface-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-tab-inactive">{currentStep + 1} / {totalSteps}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{step.title}</span>
          </div>

          {/* 메시지 목록 */}
          <ul className="px-4 py-3 flex flex-col gap-2">
            {step.targets.map((target, i) => (
              <li key={i} className="flex items-start gap-2">
                {/* 주황 불릿 */}
                <span className="mt-[3px] w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                <span className="text-sm text-foreground/90 leading-snug">
                  {target.message}
                </span>
              </li>
            ))}
          </ul>

          {/* 다음 / 시작 버튼 — 배경색 분리하여 텍스트박스와 구분 */}
          <div className="px-4 pb-4 pt-1 border-t border-card-border">
            <button
              type="button"
              onClick={onNext}
              className="w-full py-3 rounded-xl bg-orange text-background font-bold text-sm active:scale-95 transition-transform shadow-md shadow-orange/30"
            >
              {isLastStep ? "시작하기! 🎉" : "다음 →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
