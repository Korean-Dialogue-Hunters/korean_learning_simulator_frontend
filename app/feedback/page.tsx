"use client";

/* ──────────────────────────────────────────
   상세 피드백 페이지 (/feedback)
   - 대화 종료 직후 진입하는 "기본" 결과 화면
   - evaluateSession() 호출 + XP 지급 + 캐시 저장
   - 총점/등급 + 5축 레이더 + 5축 점수 바 + SCK 어휘 + 점수 산출 근거
   - "결과 요약 보기" 버튼 → /result (대화 다시보기 화면)
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Home, Layers, BarChart3, FileText, BookOpen, AlertCircle, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { EvaluationScores } from "@/types/result";
import { EvaluationResponse } from "@/types/api";
import { evaluateSession } from "@/lib/api";
import { getEvaluationCache, saveEvaluationCache } from "@/lib/historyStorage";
import { addXp, calcConversationXp, isXpAwarded, markXpAwarded } from "@/lib/xpSystem";
import { getUserId } from "@/hooks/useSetup";
import XpGainPopup, { type XpGainPopupProps } from "@/components/XpGainPopup";
import RadarChart from "@/components/result/RadarChart";
import LoadingScreen from "@/components/common/LoadingScreen";
import { clearSessionState } from "@/lib/sessionStorage";

/* ── BE 응답 → 5축 점수 변환 (모두 0~10 스케일) ── */
function extractScores(data: EvaluationResponse): EvaluationScores {
  return {
    length: data.lengthScore ?? 5,
    vocabulary: data.vocabScore ?? 5,
    sceneMission: data.contextSceneMissionMatch ?? 5,
    relationship: data.contextRelationshipMatch ?? 5,
    spelling: data.spellingScore ?? 5,
  };
}

/* ── 점수 바 ── */
function ScoreBar({ label, score, maxScore = 10 }: {
  label: string; score: number; maxScore?: number;
}) {
  const percent = Math.min((score / maxScore) * 100, 100);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        <span className="text-[13px] font-bold text-foreground">{score.toFixed(1)}</span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: "var(--color-accent)" }} />
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [evalData, setEvalData] = useState<EvaluationResponse | null>(null);
  const [scores, setScores] = useState<EvaluationScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"sessionLost" | "generic" | null>(null);
  const [xpPopup, setXpPopup] = useState<Omit<XpGainPopupProps, "onClose"> | null>(null);
  const [xpGained, setXpGained] = useState<number>(0);

  /* XP 지급 (중복 방지) */
  const awardConversationXp = (sessionId: string, totalScore10: number) => {
    const userId = getUserId();
    if (!userId) return;
    const xp = calcConversationXp(totalScore10);
    setXpGained(xp);
    if (isXpAwarded(userId, `conv_${sessionId}`)) return;
    const result = addXp(userId, xp);
    markXpAwarded(userId, `conv_${sessionId}`);
    setXpPopup(result);
  };

  useEffect(() => {
    /* 히스토리 카드에서 /result → /feedback으로 넘어온 경우 viewSessionId를 우선 사용.
       제거하지 않고 clearSessionState에 위임 (Strict Mode 재실행 대응). */
    const viewSessionId = localStorage.getItem("viewSessionId");
    const sessionId = viewSessionId || localStorage.getItem("sessionId");
    if (!sessionId) {
      router.replace("/");
      return;
    }

    /* 캐시 우선 (히스토리 카드 클릭 등) */
    const cached = getEvaluationCache(sessionId) as EvaluationResponse | null;
    if (cached) {
      setEvalData(cached);
      setScores(extractScores(cached));
      localStorage.setItem("evaluationData", JSON.stringify(cached));
      awardConversationXp(sessionId, cached.totalScore10);
      setLoading(false);
      return;
    }

    const lang = i18n.language?.startsWith("en") ? "en" : "ko";
    evaluateSession(sessionId, lang)
      .then((res) => {
        setEvalData(res);
        setScores(extractScores(res));
        localStorage.setItem("evaluationData", JSON.stringify(res));
        saveEvaluationCache(sessionId, res);
        awardConversationXp(sessionId, res.totalScore10);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (/session not found/i.test(msg) || /\b400\b/.test(msg)) {
          setErrorKind("sessionLost");
        } else {
          setErrorKind("generic");
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (loading) {
    return <LoadingScreen active variant="evaluation" />;
  }

  if (error || !evalData || !scores) {
    const isSessionLost = errorKind === "sessionLost";
    const title = isSessionLost ? t("result.sessionLostTitle") : t("feedback.loadFailed");
    const desc = isSessionLost ? t("result.sessionLostDesc") : null;

    const handleRetry = () => {
      clearSessionState();
      router.push("/location");
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-5 px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, #DC3C3C 12%, transparent)", color: "#DC3C3C" }}>
          <AlertCircle size={32} strokeWidth={1.8} />
        </div>
        <div className="space-y-2 max-w-[320px]">
          <p className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>{title}</p>
          {desc && <p className="text-sm leading-relaxed" style={{ color: "var(--color-tab-inactive)" }}>{desc}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[260px] mt-2">
          {isSessionLost && (
            <button type="button" onClick={handleRetry}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
              {t("result.sessionLostRetry")}
            </button>
          )}
          <button type="button" onClick={() => router.push("/")}
            className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-foreground)", border: "1px solid var(--color-card-border)" }}>
            {t("common.home")}
          </button>
        </div>
      </div>
    );
  }

  /* 등급 코드 추출 */
  const gradeMatch = evalData.grade.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : evalData.grade;
  const gradeLabel = evalData.grade.replace(/<\w+>/, "").trim();
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      {xpPopup && <XpGainPopup {...xpPopup} onClose={() => setXpPopup(null)} />}

      {/* ── 상단: 대화 완료 + XP ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}>
            <Trophy size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("result.title")}</h1>
        </div>
        {xpGained > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}>
            <Sparkles size={18} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
            <span className="text-lg font-black" style={{ color: "var(--color-accent)" }}>+{xpGained}</span>
            <span className="text-xs font-bold text-tab-inactive">XP</span>
          </div>
        )}
      </div>

      {/* ── 총점 + 등급 도장 카드 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-6 mb-4 flex items-center justify-between`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div>
          <p className="text-xs text-tab-inactive mb-1">{t("result.totalScore")}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{evalData.totalScore10.toFixed(1)}</span>
            <span className="text-sm text-tab-inactive">/ 10</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[11px] text-tab-inactive mb-1">{gradeLabel}</p>
          <span className="text-4xl font-black leading-none" style={{ color: gradeColor }}>
            {gradeCode}
          </span>
        </div>
      </div>

      {/* ── 1. 세부평가 (5축 레이더) ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <p className="text-sm font-bold text-foreground">{t("feedback.radarTitle")}</p>
        </div>
        <RadarChart scores={scores} />
      </div>

      {/* ── 2. 역량분석 (5축 바) ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-5 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
            <p className="text-sm font-bold text-foreground">{t("feedback.analysisTitle")}</p>
          </div>
        </div>
        <ScoreBar label={t("eval.length")} score={scores.length} />
        <ScoreBar label={t("eval.vocab")} score={scores.vocabulary} />
        <ScoreBar label={t("eval.sceneMission")} score={scores.sceneMission} />
        <ScoreBar label={t("eval.relationship")} score={scores.relationship} />
        <ScoreBar label={t("eval.spelling")} score={scores.spelling} />
      </div>

      {/* ── 2-1. SCK 어휘 사용 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-5 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
            <p className="text-sm font-bold text-foreground">{t("feedback.sckTitle")}</p>
          </div>
          <span className="text-[11px] text-tab-inactive">
            {t("feedback.sckSummary", {
              match: evalData.sckMatchCount,
              total: evalData.sckTotalTokens,
              rate: Math.round((evalData.sckMatchRate ?? 0) * 100),
            })}
          </span>
        </div>
        {Object.keys(evalData.sckLevelCounts ?? {}).length === 0 ? (
          <p className="text-[12px] text-tab-inactive text-center py-2">{t("feedback.sckEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(evalData.sckLevelCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, count]) => {
                const words = evalData.sckLevelWordCounts?.[level] ?? [];
                return (
                  <div key={level}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)" }}>
                        {t("feedback.sckLevelLabel", { level })}
                      </span>
                      <span className="text-[11px] text-tab-inactive">
                        {t("feedback.sckCount", { count })}
                      </span>
                    </div>
                    {words.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {words.map((word, i) => (
                          <span key={`${level}-${i}`}
                            className="inline-block px-2 py-0.5 rounded-md text-[11px]"
                            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-foreground)", border: "1px solid var(--color-card-border)" }}>
                            {word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── 3. 점수 산출 근거 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
        style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>{t("feedback.basisTitle")}</p>
        </div>
        <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "var(--color-foreground)" }}>
          {(i18n.language?.startsWith("en") && evalData.feedbackEn) || evalData.feedback}
        </p>
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="mt-auto space-y-3">
        <button type="button" onClick={() => router.push("/result")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
          <span>{t("result.summaryBtn")}</span>
          <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button type="button" onClick={() => router.push("/review")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, var(--color-card-bg))", color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
          <Layers size={18} strokeWidth={2} />
          <span>{t("feedback.reviewBtn")}</span>
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
