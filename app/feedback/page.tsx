"use client";

/* ──────────────────────────────────────────
   상세 피드백 페이지 (/feedback)
   - /result에서 진입하는 "상세" 결과 화면
   - 대화 다시보기 + SCK 어휘 + LLM 요약
   - "결과로 돌아가기" 버튼 → /result
   ────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Home, Layers, Zap, BookOpen, AlertCircle, Trophy, ArrowRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { EvaluationResponse } from "@/types/api";
import { evaluateSession, normalizeSckFields } from "@/lib/api";
import { getEvaluationCache, saveEvaluationCache } from "@/lib/historyStorage";
import { addXp, calcConversationXp, isXpAwarded, markXpAwarded } from "@/lib/xpSystem";
import { getUserId } from "@/hooks/useSetup";
import { loadSckExamples, getSckExample } from "@/lib/sckExamples";
import XpGainPopup, { type XpGainPopupProps } from "@/components/XpGainPopup";
import LoadingScreen from "@/components/common/LoadingScreen";
import { clearSessionState } from "@/lib/sessionStorage";


export default function FeedbackPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [evalData, setEvalData] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"sessionLost" | "generic" | null>(null);
  const [xpPopup, setXpPopup] = useState<Omit<XpGainPopupProps, "onClose"> | null>(null);
  const [xpGained, setXpGained] = useState<number>(0);
  const [showFullLog, setShowFullLog] = useState(false);
  const [mission, setMission] = useState("");
  const [sckReady, setSckReady] = useState(false);

  /* SCK 예문 데이터 로드 */
  useEffect(() => { loadSckExamples().then(() => setSckReady(true)); }, []);

  /* 미션 — 히스토리 뷰에선 localStorage myPersona가 다른 세션 것이므로 숨김 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("viewSessionId")) return;
    const isEn = (localStorage.getItem("i18nextLng") || "ko").startsWith("en");
    try {
      const persona = JSON.parse(localStorage.getItem("myPersona") || "null");
      if (persona) setMission((isEn && persona.missionEn) || persona.mission || "");
    } catch {}
  }, []);

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

    /* 캐시 우선 (히스토리 카드 클릭 등) — SCK 필드 정규화 재적용 */
    const rawCached = getEvaluationCache(sessionId) as EvaluationResponse | null;
    if (rawCached) {
      const cached = normalizeSckFields(rawCached);
      setEvalData(cached);
      localStorage.setItem("evaluationData", JSON.stringify(cached));
      awardConversationXp(sessionId, cached.totalScore10);
      setLoading(false);
      return;
    }

    const lang = i18n.language?.startsWith("en") ? "en" : "ko";
    evaluateSession(sessionId, lang)
      .then((res) => {
        setEvalData(res);
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

  if (error || !evalData) {
    const isSessionLost = errorKind === "sessionLost";
    const title = isSessionLost ? t("result.sessionLostTitle") : t("feedback.loadFailed");
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

  /* 등급 코드 추출 */
  const gradeMatch = evalData.grade.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : evalData.grade;
  const gradeLabel = evalData.grade.replace(/<\w+>/, "").trim();
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";

  /* 장면 — BE 평가 응답의 scene을 우선 사용 */
  const scene = evalData?.scene || "";

  /* 대화 로그: 기본 4개, 토글로 전체 */
  const messages = evalData.conversationLog;
  const visibleMessages = showFullLog ? messages : messages.slice(0, 4);

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
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

      {/* ── 대화 다시보기 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <p className="text-sm font-medium text-foreground">{t("result.logTitle")}</p>
        </div>
        {(mission || scene) && (
          <div className="mb-3 p-3 rounded-xl text-[12px] leading-relaxed space-y-1"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)" }}>
            {mission && (
              <div>
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>{t("result.missionLabel")}: </span>
                <span style={{ color: "var(--color-foreground)" }}>{mission}</span>
              </div>
            )}
            {scene && (
              <div>
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>{t("result.sceneLabel")}: </span>
                <span style={{ color: "var(--color-foreground)" }}>{scene}</span>
              </div>
            )}
          </div>
        )}
        {visibleMessages.map((msg, i) => {
          const isUser = msg.speaker === "user";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
              <div className="max-w-[80%] px-3.5 py-2 text-[13px] leading-relaxed"
                style={{
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  backgroundColor: isUser ? "var(--color-accent)" : "var(--color-surface)",
                  color: isUser ? "var(--color-btn-primary-text)" : "var(--color-foreground)",
                }}>
                {msg.utterance}
              </div>
            </div>
          );
        })}
        {messages.length > 4 && (
          <button type="button" onClick={() => setShowFullLog(!showFullLog)}
            className="w-full flex items-center justify-center gap-1 text-xs font-medium py-2 mt-1 rounded-xl"
            style={{ color: "var(--color-accent)" }}>
            <span>{showFullLog ? t("result.collapse") : t("result.viewAll", { count: messages.length })}</span>
            {showFullLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* ── SCK 어휘 사용 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-5 mb-4`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <p className="text-sm font-bold text-foreground">{t("feedback.sckTitle")}</p>
        </div>
        {Object.keys(evalData.sckLevelCounts ?? {}).length === 0 ? (
          <p className="text-[12px] text-tab-inactive text-center py-2">{t("feedback.sckEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(evalData.sckLevelCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, count]) => {
                const rawWords = evalData.sckLevelWordCounts?.[level];
                /* 새 형식 {word: {count, index}} / 구 형식 {word: count} / 배열 호환 */
                const wordEntries: { word: string; index?: string }[] = [];
                if (Array.isArray(rawWords)) {
                  rawWords.forEach((w) => wordEntries.push({ word: w }));
                } else if (rawWords && typeof rawWords === "object") {
                  Object.entries(rawWords).forEach(([w, val]) => {
                    const idx = typeof val === "object" && val !== null ? (val as { index?: string }).index : undefined;
                    wordEntries.push({ word: w, index: idx });
                  });
                }
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
                    {wordEntries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {wordEntries.map((entry, i) => (
                          <SckWordChip key={`${level}-${i}`} word={entry.word} index={entry.index} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── LLM 요약 ── */}
      <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
        style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)" }}>
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-foreground)" }}>
          {(i18n.language?.startsWith("en") && evalData.llmSummaryEn) || evalData.llmSummary}
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
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push(`/review?mode=quiz${evalData?.sessionId ? `&sessionId=${evalData.sessionId}` : ""}`)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, var(--color-card-bg))", color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
            <Zap size={16} strokeWidth={2} />
            <span>{t("result.quizBtn")}</span>
          </button>
          <button type="button" onClick={() => router.push(`/review?mode=flashcard${evalData?.sessionId ? `&sessionId=${evalData.sessionId}` : ""}`)}
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

/* ── SCK 단어 칩: 호버/탭 시 예문 툴팁 ── */
function SckWordChip({ word, index }: { word: string; index?: string }) {
  const [show, setShow] = useState(false);
  const example = index ? getSckExample(index) : null;

  return (
    <span
      className="relative inline-block px-2 py-0.5 rounded-md text-[11px] cursor-default"
      style={{ backgroundColor: "var(--color-surface)", color: "var(--color-foreground)", border: "1px solid var(--color-card-border)" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow((v) => !v)}
    >
      {word}
      {show && example && (
        <span
          className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] font-medium shadow-lg z-30 pointer-events-none"
          style={{
            backgroundColor: "var(--color-foreground)",
            color: "var(--color-background)",
            maxWidth: 220,
            whiteSpace: "normal",
            wordBreak: "keep-all",
          }}
        >
          {example}
        </span>
      )}
    </span>
  );
}
