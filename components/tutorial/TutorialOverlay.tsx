"use client";

/* ──────────────────────────────────────────
   TutorialOverlay — 홈 첫 접속 스포트라이트
   - SVG mask로 여러 타겟 동시 하이라이트 (구멍)
   - 하단 통합 패널: 스텝 제목 + 메시지 리스트 + 다음/시작 버튼
   - 상단 우측: 건너뛰기
   ────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [rects, setRects] = useState<(TargetRect | null)[]>([]);
  const [viewport, setViewport] = useState({ w: 480, h: 900 });

  const measureTargets = useCallback(() => {
    const measured = step.targets.map((t) => {
      const el = document.getElementById(t.targetId);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    });
    setRects(measured);
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, [step.targets]);

  useEffect(() => {
    /* 첫 타겟이 보이도록 스크롤 + 측정 타이밍 여유 */
    const firstId = step.targets[0]?.targetId;
    const firstEl = firstId ? document.getElementById(firstId) : null;
    if (firstEl) firstEl.scrollIntoView({ behavior: "auto", block: "center" });

    measureTargets();
    /* 레이아웃 안정화 후 한 번 더 측정 (폰트/이미지 로드 대비) */
    const id = window.setTimeout(measureTargets, 120);

    window.addEventListener("resize", measureTargets);
    window.addEventListener("scroll", measureTargets, { passive: true });
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measureTargets);
      window.removeEventListener("scroll", measureTargets);
    };
  }, [measureTargets, step.targets]);

  /* 배경 스크롤 잠금 (탭바 타겟 스텝에서도 움직이지 않게) */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const { w: vw, h: vh } = viewport;

  return (
    <>
      {/* SVG mask: 타겟만 구멍 뚫린 어두운 오버레이 */}
      <svg
        className="fixed inset-0 z-40 pointer-events-none"
        width="100%"
        height="100%"
        style={{ position: "fixed", top: 0, left: 0, width: vw, height: vh }}
      >
        <defs>
          <mask id="tutorial-mask">
            <rect width={vw} height={vh} fill="white" />
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
        <rect width={vw} height={vh} fill="rgba(0,0,0,0.72)" mask="url(#tutorial-mask)" />
      </svg>

      {/* 타겟 강조 테두리 */}
      {rects.map((rect, i) => {
        if (!rect) return null;
        return (
          <div
            key={i}
            className="fixed z-50 rounded-[14px] pointer-events-none"
            style={{
              top: rect.top - PADDING,
              left: rect.left - PADDING,
              width: rect.width + PADDING * 2,
              height: rect.height + PADDING * 2,
              border: "2px solid var(--color-accent)",
              boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-accent) 30%, transparent)",
            }}
          />
        );
      })}

      {/* 상단: 건너뛰기 */}
      <div className="fixed top-5 right-4 z-[60]">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-white/80 bg-black/60 px-3 py-1.5 rounded-full hover:text-white transition-colors"
        >
          {t("tutorial.skip")}
        </button>
      </div>

      {/* 하단 통합 패널 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] px-4 pb-6">
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-4 pt-4 pb-3"
            style={{ borderBottom: "1px solid var(--color-card-border)" }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className="block rounded-full transition-all duration-300"
                    style={{
                      width: i === currentStep ? 18 : 6,
                      height: 6,
                      backgroundColor: i === currentStep ? "var(--color-accent)" : "var(--color-surface-border)",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-tab-inactive">{currentStep + 1} / {totalSteps}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{t(step.titleKey)}</span>
          </div>

          {/* 메시지 리스트 */}
          <ul className="px-4 py-3 flex flex-col gap-2">
            {step.targets.map((target, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--color-accent)" }} />
                <span className="text-sm text-foreground/90 leading-snug">
                  {t(target.messageKey)}
                </span>
              </li>
            ))}
          </ul>

          {/* 다음 / 시작 버튼 */}
          <div className="px-4 pb-4 pt-1"
            style={{ borderTop: "1px solid var(--color-card-border)" }}>
            <button
              type="button"
              onClick={onNext}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-btn-primary-text)",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)",
              }}
            >
              {isLastStep ? t("tutorial.done") : t("tutorial.next")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
