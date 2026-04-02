"use client";

/* ──────────────────────────────────────────
   결과 & 점수 화면 (/result) — TODO #40~#43
   - 총점 (10점 만점) 표시
   - 티어 표시
   - 3축 점수 (어휘/상황/문법) 요약
   - 피드백 페이지로 이동 버튼

   ⚡ BE API 연동 전 mock 데이터 사용
   🔗 연동: GET /evaluation/result
   ────────────────────────────────────────── */

import { useRouter } from "next/navigation";
import { Trophy, Star, ArrowRight, Home } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { ResultData } from "@/types/result";
import { GRADE_COLORS } from "@/types/user";
import RadarChart from "@/components/result/RadarChart";

/* ── Mock 결과 데이터 ── */
const MOCK_RESULT: ResultData = {
  session_id: "mock-session-1",
  total_score_10: 7.2,
  grade: "Silver",
  scores: {
    vocabulary: 6.5,
    situation: 8.0,
    grammar: 6.8,
  },
  llm_summary: "자연스러운 인사와 장소 묻기를 잘 수행했어요! 문법을 조금 더 연습하면 좋겠어요.",
};

/* ── 점수에 따른 등급 텍스트 ── */
function getGrade(score: number): string {
  if (score >= 9) return "훌륭해요!";
  if (score >= 7) return "잘했어요!";
  if (score >= 5) return "괜찮아요";
  return "더 연습해봐요";
}

/* ── 점수 원형 게이지 ── */
function ScoreCircle({ score, label }: { score: number; label: string }) {
  const percentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          {/* 배경 원 */}
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="var(--color-card-border)"
            strokeWidth="6"
          />
          {/* 진행 원 */}
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* 중앙 점수 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-xs text-tab-inactive">{label}</span>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const result = MOCK_RESULT;
  const gradeColor = GRADE_COLORS[result.grade];

  return (
    <div
      className="flex flex-col min-h-screen px-5 pt-8 pb-24"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* ── 상단: 축하 메시지 ── */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
            color: "var(--color-accent)",
          }}
        >
          <Trophy size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">대화 완료!</h1>
        <p className="text-sm text-tab-inactive">{getGrade(result.total_score_10)}</p>
      </div>

      {/* ── 총점 카드 (#41) ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-6 text-center mb-4`}
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <p className="text-sm text-tab-inactive mb-2">총점</p>
        <div className="flex items-baseline justify-center gap-1 mb-3">
          <span className="text-5xl font-bold text-foreground">
            {result.total_score_10}
          </span>
          <span className="text-lg text-tab-inactive">/ 10</span>
        </div>

        {/* 별점 시각화 */}
        <div className="flex justify-center gap-1">
          {[...Array(10)].map((_, i) => (
            <Star
              key={i}
              size={16}
              strokeWidth={1.5}
              fill={i < Math.round(result.total_score_10) ? "var(--color-accent)" : "none"}
              color={i < Math.round(result.total_score_10) ? "var(--color-accent)" : "var(--color-card-border)"}
            />
          ))}
        </div>
      </div>

      {/* ── 티어 표시 (#42) ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 flex items-center justify-between mb-4`}
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: `2px solid ${gradeColor}`,
        }}
      >
        <div>
          <p className="text-xs text-tab-inactive mb-0.5">현재 티어</p>
          <p className="text-lg font-bold" style={{ color: gradeColor }}>
            {result.grade}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
          style={{
            backgroundColor: gradeColor + "20",
            color: gradeColor,
          }}
        >
          <Trophy size={24} strokeWidth={1.5} />
        </div>
      </div>

      {/* ── 3축 점수 ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-5 mb-4`}
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <p className="text-sm font-medium text-foreground mb-4">세부 평가</p>
        <div className="flex justify-around">
          <ScoreCircle score={result.scores.vocabulary} label="어휘 (30%)" />
          <ScoreCircle score={result.scores.situation} label="상황 (50%)" />
          <ScoreCircle score={result.scores.grammar} label="문법 (20%)" />
        </div>
      </div>

      {/* ── 방사형 그래프 (#49~#51) ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 mb-4`}
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <p className="text-sm font-medium text-foreground mb-2">역량 분석</p>
        <RadarChart scores={result.scores} />
      </div>

      {/* ── 요약 ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
          {result.llm_summary}
        </p>
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="mt-auto space-y-3">
        {/* 피드백 보기 (#43) */}
        <button
          type="button"
          onClick={() => router.push("/feedback")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-btn-primary-text)",
          }}
        >
          <span>상세 피드백 보기</span>
          <ArrowRight size={18} strokeWidth={2} />
        </button>

        {/* 홈으로 */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{
            backgroundColor: "var(--color-card-bg)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          <Home size={18} strokeWidth={2} />
          <span>홈으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
}
