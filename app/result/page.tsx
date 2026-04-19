"use client";

/* ──────────────────────────────────────────
   결과 화면 (/result)
   - 총점 + 등급 도장
   - 5축 레이더 + 점수 산출 근거 + SCK 어휘
   - 획득 XP 표시
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Trophy, ArrowRight, Home, BookOpen, AlertCircle, BarChart3, Sparkles, Zap, Layers, ChevronLeft } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { EvaluationScores } from "@/types/result";
import { EvaluationResponse } from "@/types/api";
import { evaluateSession, normalizeSckFields } from "@/lib/api";
import RadarChart from "@/components/result/RadarChart";
import ScoreBreakdownCards from "@/components/result/ScoreBreakdownCards";
import { getEvaluationCache, saveEvaluationCache } from "@/lib/historyStorage";
import { addXp, calcConversationXp, isXpAwarded, markXpAwarded } from "@/lib/xpSystem";
import { getUserId, getSavedProfile } from "@/hooks/useSetup";
import { getBelt } from "@/lib/belt";
import { mapKoreanLevel } from "@/lib/koreanLevel";
import XpGainPopup, { type XpGainPopupProps } from "@/components/XpGainPopup";
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

/* ── 점수에 따른 등급 텍스트 키 ── */
function getGradeTextKey(score: number): string {
  if (score >= 9) return "result.gradeText_great";
  if (score >= 7) return "result.gradeText_good";
  if (score >= 5) return "result.gradeText_ok";
  return "result.gradeText_practice";
}

export default function ResultPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [evalData, setEvalData] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"sessionLost" | "generic" | null>(null);
  const [scores, setScores] = useState<EvaluationScores | null>(null);
  const [xpPopup, setXpPopup] = useState<Omit<XpGainPopupProps, "onClose"> | null>(null);
  const [xpGained, setXpGained] = useState<number>(0);
  const [fromHistory, setFromHistory] = useState(false);

  /* XP 지급 (중복 방지 포함) */
  const awardConversationXp = (sessionId: string, totalScore10: number) => {
    const userId = getUserId();
    if (!userId || isXpAwarded(userId, `conv_${sessionId}`)) return;
    const xp = calcConversationXp(totalScore10);
    const result = addXp(userId, xp);
    markXpAwarded(userId, `conv_${sessionId}`);
    setXpGained(xp);
    setXpPopup(result);
  };

  useEffect(() => {
    /* 히스토리 카드에서 온 경우 viewSessionId를 우선 사용. 제거는 clearSessionState에 위임
       (여기서 즉시 removeItem하면 Strict Mode의 두 번째 effect 실행에서 null이 되어
        현재 활성 sessionId로 fallback되는 버그가 있었음) */
    const viewSessionId = localStorage.getItem("viewSessionId");
    if (viewSessionId) setFromHistory(true);
    const sessionId = viewSessionId || localStorage.getItem("sessionId");
    if (!sessionId) {
      router.replace("/");
      return;
    }

    const rawCached = getEvaluationCache(sessionId) as EvaluationResponse | null;
    if (rawCached) {
      const cached = normalizeSckFields(rawCached);
      setEvalData(cached);
      setScores(extractScores(cached));
      localStorage.setItem("evaluationData", JSON.stringify(cached));
      setXpGained(calcConversationXp(cached.totalScore10));
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
  }, [router]);

  if (loading) {
    return <LoadingScreen active variant="evaluation" />;
  }

  if (error || !evalData || !scores) {
    const isSessionLost = errorKind === "sessionLost";
    const title = isSessionLost ? t("result.sessionLostTitle") : t("result.loadFailed");
    const desc = isSessionLost ? t("result.sessionLostDesc") : null;

    const handleRetry = () => {
      clearSessionState();
      router.push("/location");
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-5 px-6 text-center">
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

  /* BE grade 문자열에서 등급 코드 추출: "Beginner <B>" → "B" */
  const gradeMatch = evalData.grade.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : evalData.grade;
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";
  /* 유저의 현재 벨트 — 등급 위 라벨로 표시 */
  const profile = typeof window !== "undefined" ? getSavedProfile() : null;
  const belt = getBelt(profile ? mapKoreanLevel(profile.koreanLevel) : 1);
  const beltLabel = i18n.language?.startsWith("ko") ? `${belt.nameKo}띠` : `${belt.name} Belt`;

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      {xpPopup && <XpGainPopup {...xpPopup} onClose={() => setXpPopup(null)} />}

      {/* ── 기록 탭에서 온 경우 뒤로가기 ── */}
      {fromHistory && (
        <button
          type="button"
          onClick={() => { localStorage.removeItem("viewSessionId"); router.push("/history"); }}
          className="flex items-center gap-1 mb-4 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--color-tab-inactive)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
          <span>{t("result.backToHistory")}</span>
        </button>
      )}

      {/* ── 상단: 대화 완료 + XP ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}>
            <Trophy size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("result.title")}</h1>
            <p className="text-sm text-tab-inactive">{t(getGradeTextKey(evalData.totalScore10))}</p>
          </div>
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
        {/* 왼쪽: 총점 */}
        <div>
          <p className="text-xs text-tab-inactive mb-1">{t("result.totalScore")}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{evalData.totalScore10.toFixed(1)}</span>
            <span className="text-sm text-tab-inactive">/ 10</span>
          </div>
        </div>
        {/* 오른쪽: 등급 도장 — 위에 유저 벨트 라벨 (벨트 색상 적용) */}
        <div className="flex flex-col items-end">
          <p className="text-[11px] font-bold mb-1" style={{ color: belt.color }}>{beltLabel}</p>
          <span className="text-4xl font-black leading-none" style={{ color: gradeColor }}>
            {gradeCode}
            <span className="text-base font-bold"> {t("result.gradeLabel")}</span>
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

      {/* ── 2. 점수 산출 근거 (카테고리별 카드) ── */}
      <ScoreBreakdownCards evalData={evalData} />

      {/* ── 하단 버튼 ── */}
      <div className="mt-auto space-y-3">
        <button type="button" onClick={() => router.push("/feedback")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
          <span>{t("result.feedbackBtn")}</span>
          <ArrowRight size={18} strokeWidth={2} />
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push(`/review?mode=quiz&sessionId=${evalData.sessionId}`)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, var(--color-card-bg))", color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
            <Zap size={16} strokeWidth={2} />
            <span>{t("result.quizBtn")}</span>
          </button>
          <button type="button" onClick={() => router.push(`/review?mode=flashcard&sessionId=${evalData.sessionId}`)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, var(--color-card-bg))", color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
            <Layers size={16} strokeWidth={2} />
            <span>{t("result.flashcardBtn")}</span>
          </button>
        </div>
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
