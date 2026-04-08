"use client";

/* ──────────────────────────────────────────
   결과 & 점수 화면 (/result) — TODO #40~#43
   - 대화 종료 후 POST /v1/sessions/{id}/evaluation 호출
   - 총점, 등급, 3축 점수, LLM 요약 표시
   - 피드백 페이지로 이동 버튼
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Trophy, Star, ArrowRight, Home, BookOpen } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { EvaluationScores } from "@/types/result";
import { EvaluationResponse } from "@/types/api";
import RadarChart from "@/components/result/RadarChart";
import { evaluateSession } from "@/lib/api";
import { addHistory } from "@/lib/historyStorage";

/* ── 점수에 따른 등급 텍스트 키 ── */
function getGradeTextKey(score: number): string {
  if (score >= 9) return "result.gradeText_great";
  if (score >= 7) return "result.gradeText_good";
  if (score >= 5) return "result.gradeText_ok";
  return "result.gradeText_practice";
}

/* ── BE EvaluationResponse → EvaluationScores 변환 ── */
function extractScores(data: EvaluationResponse): EvaluationScores {
  return {
    vocabulary: data.vocabScore ?? 5,
    context: data.contextScore ?? 5,
    spelling: data.spellingScore ?? 5,
  };
}

/* ── 점수 원형 게이지 ── */
function ScoreCircle({ score, label }: { score: number; label: string }) {
  const percentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-card-border)" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-accent)" strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-xs text-tab-inactive">{label}</span>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [evalData, setEvalData] = useState<EvaluationResponse | null>(null);
  const [scores, setScores] = useState<EvaluationScores>({ vocabulary: 5, context: 5, spelling: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      router.replace("/");
      return;
    }

    /* POST /v1/sessions/{id}/evaluation — 평가 요청 */
    evaluateSession(sessionId)
      .then((res) => {
        setEvalData(res);
        setScores(extractScores(res));
        /* 피드백 페이지에서도 사용할 수 있도록 저장 */
        sessionStorage.setItem("evaluationData", JSON.stringify(res));
        /* 대화 기록에 저장 */
        addHistory({
          sessionId: res.sessionId,
          scenarioTitle: res.scenarioTitle,
          location: res.location,
          scene: res.scene ?? "",
          totalScore10: res.totalScore10,
          grade: res.grade,
          feedback: res.feedback,
          llmSummary: res.llmSummary,
          turnCount: res.conversationLog.filter((e) => e.role === "user").length,
          createdAt: new Date().toISOString(),
        });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "평가 요청에 실패했습니다");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-tab-inactive text-sm">{t("result.analyzing")}</p>
      </div>
    );
  }

  if (error || !evalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <p className="text-sm" style={{ color: "#DC3C3C" }}>{error || t("result.loadFailed")}</p>
        <button onClick={() => router.push("/")} className="text-sm text-accent underline">{t("common.home")}</button>
      </div>
    );
  }

  /* BE grade 문자열에서 등급 코드 추출: "Beginner <B>" → "B" */
  const gradeMatch = evalData.grade.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : evalData.grade;
  const gradeLabel = evalData.grade.replace(/<\w+>/, "").trim();
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      {/* ── 상단: 축하 메시지 ── */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}>
          <Trophy size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("result.title")}</h1>
        <p className="text-sm text-tab-inactive">{t(getGradeTextKey(evalData.totalScore10))}</p>
      </div>

      {/* ── 총점 카드 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-6 text-center mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <p className="text-sm text-tab-inactive mb-2">{t("result.totalScore")}</p>
        <div className="flex items-baseline justify-center gap-1 mb-3">
          <span className="text-5xl font-bold text-foreground">{evalData.totalScore10.toFixed(1)}</span>
          <span className="text-lg text-tab-inactive">/ 10</span>
        </div>
        <div className="flex justify-center gap-1">
          {[...Array(10)].map((_, i) => (
            <Star key={i} size={16} strokeWidth={1.5}
              fill={i < Math.round(evalData.totalScore10) ? "var(--color-accent)" : "none"}
              color={i < Math.round(evalData.totalScore10) ? "var(--color-accent)" : "var(--color-card-border)"} />
          ))}
        </div>
      </div>

      {/* ── Grade 스탬프 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-5 mb-4 flex items-center justify-between`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div>
          <p className="text-xs text-tab-inactive mb-1">{t("result.thisConvGrade")}</p>
          <p className="text-sm font-medium text-foreground">{gradeLabel}</p>
        </div>
        {/* 스탬프 */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center -rotate-12"
          style={{
            border: `3px solid ${gradeColor}`,
            color: gradeColor,
          }}>
          <span className="text-2xl font-black tracking-tight">{gradeCode}</span>
        </div>
      </div>

      {/* ── 3축 점수 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-5 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <p className="text-sm font-medium text-foreground mb-4">{t("result.detail")}</p>
        <div className="flex justify-around">
          <ScoreCircle score={scores.vocabulary} label={t("result.vocab")} />
          <ScoreCircle score={scores.context} label={t("result.context")} />
          <ScoreCircle score={scores.spelling} label={t("result.spelling")} />
        </div>
      </div>

      {/* ── 방사형 그래프 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <p className="text-sm font-medium text-foreground mb-2">{t("result.radarTitle")}</p>
        <RadarChart scores={scores} />
      </div>

      {/* ── 요약 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
        style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)" }}>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
          {evalData.llmSummary}
        </p>
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="mt-auto space-y-3">
        <button type="button" onClick={() => router.push("/feedback")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
          <span>{t("result.feedbackBtn")}</span>
          <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button type="button" onClick={() => router.push("/review")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, var(--color-card-bg))", color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
          <BookOpen size={18} strokeWidth={2} />
          <span>{t("result.reviewBtn")}</span>
        </button>
        <button type="button" onClick={() => router.push("/")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-foreground)", border: "1px solid var(--color-card-border)" }}>
          <Home size={18} strokeWidth={2} />
          <span>{t("common.home")}</span>
        </button>
      </div>
    </div>
  );
}
