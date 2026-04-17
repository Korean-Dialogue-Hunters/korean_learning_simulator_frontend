"use client";

/* ──────────────────────────────────────────
   점수 산출 근거 카드 (5축)
   - BE feedback 문자열을 "==========================" 구분자로 파싱
   - 카테고리별 카드(1/5~5/5)로 표시, 우상단 화살표로 순환
   - 파싱 실패 시 원문 단일 블록 폴백
   ────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, FileText } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import type { EvaluationResponse } from "@/types/api";

interface CategoryMeta {
  labelKey: string;
  score: number;
}

/* BE feedback 본문 → 5개 섹션 배열. 실패 시 null */
function parseSections(text: string): string[] | null {
  if (!text) return null;
  const sections = text
    .split(/={5,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sections.length === 5 ? sections : null;
}

/* 섹션 헤더(이모지·타이틀·점수) 정리 후 본문만 반환.
   - 첫 줄이 "<emoji> <title> : X.X/10" 형태면 전체 제거
   - 아니면 "<emoji> <title> : " 프리픽스만 제거해 내용 보존 (어휘·맞춤법 섹션) */
function stripSectionHeader(section: string): string {
  const headerOnly = /^\s*[1-5]\uFE0F\u20E3[^:\n]*:\s*\d+(?:\.\d+)?\s*\/\s*10\s*$/mu;
  const firstNewline = section.indexOf("\n");
  const firstLine = firstNewline === -1 ? section : section.slice(0, firstNewline);
  if (headerOnly.test(firstLine)) {
    return firstNewline === -1 ? "" : section.slice(firstNewline + 1).trim();
  }
  return section.replace(/^\s*[1-5]\uFE0F\u20E3[^:\n]*:\s*/u, "").trim();
}

interface Props {
  evalData: EvaluationResponse;
}

export default function ScoreBreakdownCards({ evalData }: Props) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);

  const raw = (i18n.language?.startsWith("en") && evalData.feedbackEn) || evalData.feedback;
  const sections = useMemo(() => parseSections(raw), [raw]);

  /* BE 피드백 순서: length → vocab → spelling → sceneMission → relationship */
  const categories: CategoryMeta[] = [
    { labelKey: "eval.length", score: evalData.lengthScore ?? 0 },
    { labelKey: "eval.vocab", score: evalData.vocabScore ?? 0 },
    { labelKey: "eval.spelling", score: evalData.spellingScore ?? 0 },
    { labelKey: "eval.sceneMission", score: evalData.contextSceneMissionMatch ?? 0 },
    { labelKey: "eval.relationship", score: evalData.contextRelationshipMatch ?? 0 },
  ];

  /* 파싱 실패 시 원문 폴백 (BE 포맷이 바뀌면 여기로 빠짐) */
  if (!sections) {
    return (
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 mb-4`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>
            {t("feedback.basisTitle")}
          </p>
        </div>
        <p
          className="text-[13px] leading-relaxed whitespace-pre-line"
          style={{ color: "var(--color-foreground)" }}
        >
          {raw}
        </p>
      </div>
    );
  }

  const current = categories[index];
  const body = stripSectionHeader(sections[index]);

  return (
    <div
      className={`${COMMON_CLASSES.cardRounded} p-4 mb-4 flex flex-col`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
        minHeight: 220,
      }}
    >
      {/* 헤더: 번호 뱃지 · 카테고리 타이틀 · 점수 · 다음 화살표 */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black shrink-0"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            {index + 1}
          </span>
          <p className="text-sm font-bold truncate" style={{ color: "var(--color-foreground)" }}>
            {t(current.labelKey)}
          </p>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            {current.score.toFixed(1)}/10
          </span>
        </div>
        <button
          type="button"
          aria-label={t("feedback.nextCategory")}
          onClick={() => setIndex((i) => (i + 1) % categories.length)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 hover:opacity-80 shrink-0"
          style={{
            backgroundColor: "var(--color-card-bg)",
            color: "var(--color-accent)",
            border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>

      {/* 본문 */}
      <p
        className="text-[13px] leading-relaxed whitespace-pre-line flex-1"
        style={{ color: "var(--color-foreground)" }}
      >
        {body}
      </p>

      {/* 페이지네이션 도트 (클릭으로도 이동 가능) */}
      <div className="flex items-center justify-center gap-1.5 mt-4" role="tablist">
        {categories.map((c, i) => (
          <button
            key={c.labelKey}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${i + 1} / ${categories.length}`}
            onClick={() => setIndex(i)}
            className="transition-all"
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i === index
                  ? "var(--color-accent)"
                  : "color-mix(in srgb, var(--color-accent) 25%, transparent)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
