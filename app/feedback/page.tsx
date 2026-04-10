"use client";

/* ──────────────────────────────────────────
   피드백 페이지 (/feedback) — TODO #44~#48
   - 대화 로그 다시보기 (스크롤)
   - 오답 부분 빨간 음영 표시
   - 틀린 단어 목록 + 뜻풀이
   - 대화 요약 피드백 텍스트

   🔗 연동: POST /v1/sessions/{id}/evaluation 결과 사용
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageCircle, BookOpen, ChevronDown, ChevronUp, Home, Layers } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { FeedbackData, FeedbackMessage } from "@/types/result";
import { EvaluationResponse } from "@/types/api";
import RadarChart from "@/components/result/RadarChart";

/* ── 대화 로그 말풍선 ── */
function FeedbackBubble({ msg }: { msg: FeedbackMessage }) {
  const isUser = msg.speaker === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed"
        style={{
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          backgroundColor: isUser ? "var(--color-accent)" : "var(--color-card-bg)",
          color: isUser ? "var(--color-btn-primary-text)" : "var(--color-foreground)",
          border: isUser ? "none" : "1px solid var(--color-card-border)",
        }}
      >
        {msg.utterance}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullLog, setShowFullLog] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("evaluationData");
    if (!raw) {
      router.replace("/result");
      return;
    }
    try {
      const evalData = JSON.parse(raw) as EvaluationResponse;
      const messages: FeedbackMessage[] = evalData.conversationLog.map((entry) => ({
        speaker: entry.speaker,
        utterance: entry.utterance,
      }));

      setFeedback({
        sessionId: evalData.sessionId,
        totalScore10: evalData.totalScore10,
        scores: {
          vocabulary: evalData.vocabScore ?? 5,
          context: evalData.contextScore ?? 5,
          spelling: evalData.spellingScore ?? 5,
        },
        feedback: evalData.feedback,
        wrongWords: [],
        messages,
      });
    } catch {
      router.replace("/result");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-tab-inactive text-sm">{t("feedback.loading")}</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <p className="text-sm" style={{ color: "#DC3C3C" }}>{t("feedback.loadFailed")}</p>
        <button onClick={() => router.push("/")} className="text-sm text-accent underline">{t("common.home")}</button>
      </div>
    );
  }

  /* 대화 로그: 기본 4개만 표시, 전체보기 토글 */
  const visibleMessages = showFullLog
    ? feedback.messages
    : feedback.messages.slice(0, 4);

  return (
    <div
      className="flex flex-col min-h-screen px-5 pt-16 pb-24"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* ── 뒤로가기 ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("feedback.backBtn")}</span>
      </button>

      {/* ── 헤더 ── */}
      <h1 className="text-xl font-bold text-foreground mb-1">{t("feedback.title")}</h1>
      <p className="text-sm text-tab-inactive mb-6">
        {t("feedback.totalScoreLabel")} <span className="font-bold text-accent">{feedback.totalScore10}</span> / 10
      </p>

      {/* ── 피드백 요약 (#48) ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
        }}
      >
        <div className="flex items-start gap-2">
          <MessageCircle size={16} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--color-accent)" }} />
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-foreground)" }}>
            {feedback.feedback}
          </p>
        </div>
      </div>

      {/* ── 방사형 그래프 ── */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <p className="text-sm font-medium text-foreground mb-2">{t("feedback.radarTitle")}</p>
        <RadarChart scores={feedback.scores} />
      </div>

      {/* ── 대화 로그 다시보기 ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm font-bold text-foreground">{t("feedback.logTitle")}</h2>
        </div>

        <div
          className={`${COMMON_CLASSES.cardRounded} p-4`}
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          {visibleMessages.map((msg, i) => (
            <FeedbackBubble key={i} msg={msg} />
          ))}

          {/* 전체보기 / 접기 토글 */}
          {feedback.messages.length > 4 && (
            <button
              type="button"
              onClick={() => setShowFullLog(!showFullLog)}
              className="w-full flex items-center justify-center gap-1 text-xs font-medium py-2 mt-2 rounded-xl transition-all hover:opacity-70"
              style={{ color: "var(--color-accent)" }}
            >
              <span>{showFullLog ? t("feedback.collapse") : t("feedback.viewAll", { count: feedback.messages.length })}</span>
              {showFullLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={() => router.push("/review")}
          className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2`}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-btn-primary-text)",
          }}
        >
          <Layers size={18} strokeWidth={2} />
          <span>{t("feedback.reviewBtn")}</span>
        </button>
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
          <span>{t("common.home")}</span>
        </button>
      </div>
    </div>
  );
}
