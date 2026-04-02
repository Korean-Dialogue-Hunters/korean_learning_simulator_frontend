"use client";

/* ──────────────────────────────────────────
   피드백 페이지 (/feedback) — TODO #44~#48
   - 대화 로그 다시보기 (스크롤)
   - 오답 부분 빨간 음영 표시
   - 틀린 단어 목록 + 뜻풀이
   - 대화 요약 피드백 텍스트

   ⚡ BE API 연동 전 mock 데이터 사용
   🔗 연동: GET /evaluation/feedback
   ────────────────────────────────────────── */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, AlertCircle, BookOpen, ChevronDown, ChevronUp, Home } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { FeedbackData, FeedbackMessage, WrongWord } from "@/types/result";
import RadarChart from "@/components/result/RadarChart";

/* ── Mock 피드백 데이터 ── */
const MOCK_FEEDBACK: FeedbackData = {
  session_id: "mock-session-1",
  total_score_10: 7.2,
  scores: {
    vocabulary: 6.5,
    situation: 8.0,
    grammar: 6.8,
  },
  feedback:
    "전반적으로 자연스러운 대화를 이끌어가셨어요! 인사와 장소 묻기를 잘 수행했습니다. 다만, 조사 사용('에서'와 '에')과 높임말 어미('-세요')의 정확한 사용을 좀 더 연습하시면 더 좋겠습니다.",
  wrong_words: [
    {
      original: "한강에서 가요",
      corrected: "한강에 가요",
      meaning: "'에서'는 행동이 일어나는 장소, '에'는 이동의 목적지를 나타냅니다",
    },
    {
      original: "어디 있어?",
      corrected: "어디에 있어요?",
      meaning: "처음 만난 사람에게는 높임말(-요)을 사용하는 것이 자연스럽습니다",
    },
    {
      original: "맛있는 거 먹자",
      corrected: "맛있는 거 먹을까요?",
      meaning: "제안할 때 '-ㄹ까요?'를 쓰면 더 정중한 표현이 됩니다",
    },
  ],
  messages: [
    { speaker: "user", utterance: "안녕하세요! 한강에서 가요?", has_error: true, error_highlights: ["한강에서 가요"] },
    { speaker: "ai", utterance: "안녕하세요! 네, 한강에 가고 있어요. 날씨가 좋네요!", has_error: false },
    { speaker: "user", utterance: "자전거 어디 있어?", has_error: true, error_highlights: ["어디 있어?"] },
    { speaker: "ai", utterance: "저기 편의점 옆에 자전거 대여소가 있어요!", has_error: false },
    { speaker: "user", utterance: "아 감사합니다! 같이 타볼까요?", has_error: false },
    { speaker: "ai", utterance: "좋아요! 같이 타요. 어디로 갈까요?", has_error: false },
    { speaker: "user", utterance: "여의도 쪽으로 가서 맛있는 거 먹자", has_error: true, error_highlights: ["맛있는 거 먹자"] },
    { speaker: "ai", utterance: "좋은 생각이에요! 여의도에 유명한 치킨집이 있어요.", has_error: false },
  ],
};

/* ── 오답 하이라이트 렌더링 ── */
function HighlightedText({ text, highlights }: { text: string; highlights?: string[] }) {
  if (!highlights || highlights.length === 0) {
    return <span>{text}</span>;
  }

  let result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  for (const hl of highlights) {
    const idx = remaining.indexOf(hl);
    if (idx === -1) continue;

    /* 하이라이트 앞부분 */
    if (idx > 0) {
      result.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
    }
    /* 하이라이트 부분 (빨간 음영) */
    result.push(
      <span
        key={key++}
        className="px-0.5 rounded"
        style={{
          backgroundColor: "rgba(220, 60, 60, 0.15)",
          color: "#DC3C3C",
          textDecoration: "underline wavy",
          textDecorationColor: "#DC3C3C",
          textUnderlineOffset: "3px",
        }}
      >
        {hl}
      </span>
    );
    remaining = remaining.slice(idx + hl.length);
  }

  /* 나머지 텍스트 */
  if (remaining) {
    result.push(<span key={key++}>{remaining}</span>);
  }

  return <>{result}</>;
}

/* ── 대화 로그 말풍선 ── */
function FeedbackBubble({ msg }: { msg: FeedbackMessage }) {
  const isUser = msg.speaker === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed"
        style={{
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          backgroundColor: isUser
            ? msg.has_error
              ? "rgba(220, 60, 60, 0.08)"
              : "var(--color-accent)"
            : "var(--color-card-bg)",
          color: isUser
            ? msg.has_error
              ? "var(--color-foreground)"
              : "var(--color-btn-primary-text)"
            : "var(--color-foreground)",
          border: isUser
            ? msg.has_error
              ? "1.5px solid rgba(220, 60, 60, 0.3)"
              : "none"
            : "1px solid var(--color-card-border)",
        }}
      >
        {isUser && msg.has_error ? (
          <HighlightedText text={msg.utterance} highlights={msg.error_highlights} />
        ) : (
          msg.utterance
        )}
      </div>
    </div>
  );
}

/* ── 틀린 단어 카드 ── */
function WrongWordCard({ word, index }: { word: WrongWord; index: number }) {
  return (
    <div
      className={`${COMMON_CLASSES.cardRounded} p-4`}
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ backgroundColor: "rgba(220, 60, 60, 0.1)", color: "#DC3C3C" }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          {/* 원래 표현 → 올바른 표현 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-sm line-through"
              style={{ color: "#DC3C3C" }}
            >
              {word.original}
            </span>
            <span className="text-tab-inactive text-xs">→</span>
            <span
              className="text-sm font-medium"
              style={{ color: "#2D8C4E" }}
            >
              {word.corrected}
            </span>
          </div>
          {/* 설명 */}
          <p className="text-xs text-tab-inactive leading-relaxed">
            {word.meaning}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const feedback = MOCK_FEEDBACK;
  const [showFullLog, setShowFullLog] = useState(false);

  /* 대화 로그: 기본 4개만 표시, 전체보기 토글 */
  const visibleMessages = showFullLog
    ? feedback.messages
    : feedback.messages.slice(0, 4);

  return (
    <div
      className="flex flex-col min-h-screen px-5 pt-6 pb-24"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* ── 뒤로가기 ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>결과로 돌아가기</span>
      </button>

      {/* ── 헤더 ── */}
      <h1 className="text-xl font-bold text-foreground mb-1">상세 피드백</h1>
      <p className="text-sm text-tab-inactive mb-6">
        총점 <span className="font-bold text-accent">{feedback.total_score_10}</span> / 10
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
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
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
        <p className="text-sm font-medium text-foreground mb-2">역량 분석</p>
        <RadarChart scores={feedback.scores} />
      </div>

      {/* ── 틀린 단�� 목록 (#47) ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} strokeWidth={2} style={{ color: "#DC3C3C" }} />
          <h2 className="text-sm font-bold text-foreground">
            교정이 필요한 표현 ({feedback.wrong_words.length})
          </h2>
        </div>
        <div className="space-y-3">
          {feedback.wrong_words.map((word, i) => (
            <WrongWordCard key={i} word={word} index={i} />
          ))}
        </div>
      </div>

      {/* ── 대화 로그 다시보기 (#45, #46) ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm font-bold text-foreground">대화 다시보기</h2>
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
              <span>{showFullLog ? "접기" : `전체 대화 보기 (${feedback.messages.length})`}</span>
              {showFullLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── 홈으로 돌아가기 ── */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className={`${COMMON_CLASSES.fullWidthBtn} flex items-center justify-center gap-2 mt-auto`}
        style={{
          backgroundColor: "var(--color-accent)",
          color: "var(--color-btn-primary-text)",
        }}
      >
        <Home size={18} strokeWidth={2} />
        <span>홈으로 돌아가기</span>
      </button>
    </div>
  );
}
