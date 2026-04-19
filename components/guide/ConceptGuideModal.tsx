"use client";

/* ──────────────────────────────────────────
   ConceptGuideModal — 앱 개념 가이드 (풀스크린 모달, 6 슬라이드)
   - 온보딩 스팟라이트 아니라 "개념 설명 가이드"
   - 진입: /settings 의 "앱 가이드 보기" 버튼
   - 내용: 흐름 / 벨트 vs Lv. / SCK / 평가·등급 / 승급·강등 / 복습·숨기기
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Award,
  BookOpen,
  Gauge,
  TrendingUp,
  EyeOff,
  LucideIcon,
} from "lucide-react";

interface ConceptGuideModalProps {
  open: boolean;
  onClose: () => void;
}

type SlideKey = "flow" | "beltVsLevel" | "sck" | "scoring" | "promotion" | "review";

const SLIDES: { key: SlideKey; Icon: LucideIcon }[] = [
  { key: "flow",        Icon: MapPin },
  { key: "beltVsLevel", Icon: Award },
  { key: "sck",         Icon: BookOpen },
  { key: "scoring",     Icon: Gauge },
  { key: "promotion",   Icon: TrendingUp },
  { key: "review",      Icon: EyeOff },
];

export default function ConceptGuideModal({ open, onClose }: ConceptGuideModalProps) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);

  /* 열릴 때마다 첫 슬라이드부터 */
  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  /* 열려 있을 때 배경 스크롤 잠금 */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const slide = SLIDES[idx];
  const isFirst = idx === 0;
  const isLast = idx === SLIDES.length - 1;

  const rawBullets = t(`guide.slides.${slide.key}.bullets`, { returnObjects: true }) as unknown;
  const bullets: string[] = Array.isArray(rawBullets) ? (rawBullets as string[]) : [];

  const handleClose = () => {
    setIdx(0);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
      role="dialog"
      aria-modal="true"
      aria-label={t("guide.title")}
    >
      {/* 헤더: 진행 인디케이터 + 닫기 */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                backgroundColor: i === idx ? "var(--color-accent)" : "var(--color-surface-border)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t("guide.close")}
          className="text-tab-inactive hover:opacity-70 active:scale-95 transition-all"
        >
          <X size={22} strokeWidth={2} />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-accent) 14%, var(--color-card-bg))",
              border: "1px solid var(--color-card-border)",
            }}
          >
            <slide.Icon size={24} strokeWidth={2} className="text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {t(`guide.slides.${slide.key}.title`)}
          </h2>
        </div>

        <p className="text-sm text-tab-inactive leading-relaxed mb-5">
          {t(`guide.slides.${slide.key}.lead`)}
        </p>

        <ul className="flex flex-col gap-3">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl px-3.5 py-3"
              style={{
                backgroundColor: "var(--color-card-bg)",
                border: "1px solid var(--color-card-border)",
              }}
            >
              <span
                className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="text-sm text-foreground/90 leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 버튼 */}
      <div
        className="px-5 pb-8 pt-3 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--color-card-border)" }}
      >
        <button
          type="button"
          onClick={() => setIdx((n) => Math.max(0, n - 1))}
          disabled={isFirst}
          className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-1 disabled:opacity-30 active:scale-95 transition-all"
          style={{ color: "var(--color-foreground)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
          {t("guide.prev")}
        </button>
        <div className="flex-1" />
        {isLast ? (
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            {t("guide.done")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIdx((n) => Math.min(SLIDES.length - 1, n + 1))}
            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-1 active:scale-95 transition-transform"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            {t("guide.next")}
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
