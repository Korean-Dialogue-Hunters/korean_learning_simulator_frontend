"use client";

/* ──────────────────────────────────────────
   복습 페이지 (/review)
   - 초성퀴즈 / 플래시카드 두 가지 모드
   - GET /v1/users/{nickname}/review/weekly 로 콘텐츠 생성·조회
   - GET /v1/users/{nickname}/review/count 로 개수 표시
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Zap, Layers, ArrowLeft, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { getSavedProfile } from "@/hooks/useSetup";
import { getReviewCount, getWeeklyReview } from "@/lib/api";
import type { ReviewCountResponse, WeeklyReviewResponse, ChosungQuizItem, FlashcardItem } from "@/types/api";

type Mode = "list" | "quiz" | "flashcard";

export default function ReviewPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("list");
  const [counts, setCounts] = useState<ReviewCountResponse | null>(null);
  const [reviewData, setReviewData] = useState<WeeklyReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const profile = typeof window !== "undefined" ? getSavedProfile() : null;

  /* 진입 시 count 조회 */
  useEffect(() => {
    if (!profile) return;
    getReviewCount(profile.userNickname)
      .then(setCounts)
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 모드 시작 → 데이터 로드 */
  const startMode = async (m: "quiz" | "flashcard") => {
    if (!profile) return;
    setLoading(true);
    setError("");
    try {
      const data = await getWeeklyReview(profile.userNickname);
      setReviewData(data);
      setMode(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("review.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-tab-inactive text-sm">{t("review.loading")}</p>
      </div>
    );
  }

  if (mode === "quiz" && reviewData) {
    return <ChosungQuizView items={reviewData.chosungQuiz} onBack={() => setMode("list")} />;
  }

  if (mode === "flashcard" && reviewData) {
    return <FlashcardView items={reviewData.flashcards} onBack={() => setMode("list")} />;
  }

  /* ── 모드 목록 화면 ── */
  const quizCount = counts?.chosungQuizCount ?? 0;
  const flashCount = counts?.flashcardCount ?? 0;
  const isEmpty = quizCount === 0 && flashCount === 0;

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={22} strokeWidth={2} className="text-accent" />
        <h1 className="text-xl font-bold text-foreground">{t("review.title")}</h1>
      </div>
      <p className="text-sm text-tab-inactive mb-8">{t("review.subtitle")}</p>

      {error && (
        <p className="text-sm text-center mb-4" style={{ color: "#DC3C3C" }}>{error}</p>
      )}

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-tab-inactive text-center whitespace-pre-line">{t("review.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 초성퀴즈 카드 */}
          <ModeCard
            icon={<Zap size={24} strokeWidth={2} />}
            title={t("review.chosungTitle")}
            desc={t("review.chosungDesc")}
            count={t("review.chosungCount", { count: quizCount })}
            disabled={quizCount === 0}
            onStart={() => startMode("quiz")}
          />

          {/* 플래시카드 카드 */}
          <ModeCard
            icon={<Layers size={24} strokeWidth={2} />}
            title={t("review.flashcardTitle")}
            desc={t("review.flashcardDesc")}
            count={t("review.flashcardCount", { count: flashCount })}
            disabled={flashCount === 0}
            onStart={() => startMode("flashcard")}
          />
        </div>
      )}
    </div>
  );
}

/* ── 모드 선택 카드 ── */
function ModeCard({
  icon, title, desc, count, disabled, onStart,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  count: string;
  disabled: boolean;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${COMMON_CLASSES.cardRounded} p-5`}
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)" }}>
              {count}
            </span>
          </div>
          <p className="text-xs text-tab-inactive leading-relaxed mb-3">{desc}</p>
          <button
            type="button"
            disabled={disabled}
            onClick={onStart}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              backgroundColor: disabled ? "var(--color-surface)" : "var(--color-accent)",
              color: disabled ? "var(--color-tab-inactive)" : "var(--color-btn-primary-text)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {t("review.startBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   초성 퀴즈 뷰
   ══════════════════════════════════════════ */
function ChosungQuizView({ items, onBack }: { items: ChosungQuizItem[]; onBack: () => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <p className="text-sm text-tab-inactive">{t("review.empty")}</p>
        <button onClick={onBack} className="text-sm text-accent underline">{t("review.backToList")}</button>
      </div>
    );
  }

  const item = items[current];
  // BE 스키마 유동적: chosung/word/meaning 등 필드 추출
  const chosung = (item as Record<string, unknown>).chosung as string ?? (item as Record<string, unknown>).quiz_id as string ?? "?";
  const answer = (item as Record<string, unknown>).word as string ?? (item as Record<string, unknown>).answer as string ?? "";
  const meaning = (item as Record<string, unknown>).meaning as string ?? "";

  const handleNext = (isCorrect: boolean) => {
    if (isCorrect) setCorrect((c) => c + 1);
    if (current + 1 >= items.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setShowAnswer(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}>
          <Check size={32} strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t("review.quizComplete")}</h2>
        <p className="text-sm text-tab-inactive">{t("review.quizScore", { correct, total: items.length })}</p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => { setCurrent(0); setCorrect(0); setDone(false); setShowAnswer(false); }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-foreground)", border: "1px solid var(--color-card-border)" }}>
            {t("review.retryQuiz")}
          </button>
          <button onClick={onBack}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
            {t("review.backToReview")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70">
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("review.backToList")}</span>
      </button>

      {/* 진행 표시 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">{t("review.chosungTitle")}</h2>
        <span className="text-xs text-tab-inactive">{current + 1} / {items.length}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-border mb-8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / items.length) * 100}%`, backgroundColor: "var(--color-accent)" }} />
      </div>

      {/* 퀴즈 카드 */}
      <div className={`${COMMON_CLASSES.cardRounded} p-8 text-center flex-1 flex flex-col items-center justify-center`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        <p className="text-xs text-tab-inactive mb-4">{t("review.quizQuestion")}</p>
        <p className="text-4xl font-black text-foreground tracking-[0.3em] mb-6">{chosung}</p>

        {showAnswer ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-accent">{answer}</p>
            {meaning && <p className="text-sm text-tab-inactive">{meaning}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleNext(false)}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-tab-inactive)" }}>
                <X size={16} />
                <span>Nope</span>
              </button>
              <button onClick={() => handleNext(true)}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
                <Check size={16} />
                <span>Got it!</span>
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAnswer(true)}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
            {t("review.showAnswer")}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   플래시카드 뷰
   ══════════════════════════════════════════ */
function FlashcardView({ items, onBack }: { items: FlashcardItem[]; onBack: () => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <p className="text-sm text-tab-inactive">{t("review.empty")}</p>
        <button onClick={onBack} className="text-sm text-accent underline">{t("review.backToList")}</button>
      </div>
    );
  }

  const item = items[current];
  const isLast = current === items.length - 1;

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70">
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("review.backToList")}</span>
      </button>

      {/* 진행 표시 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">{t("review.flashcardTitle")}</h2>
        <span className="text-xs text-tab-inactive">{t("review.cardProgress", { current: current + 1, total: items.length })}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-border mb-8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / items.length) * 100}%`, backgroundColor: "var(--color-accent)" }} />
      </div>

      {/* 카드 */}
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className={`${COMMON_CLASSES.cardRounded} p-8 text-center flex-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.98]`}
        style={{
          backgroundColor: flipped
            ? "color-mix(in srgb, var(--color-accent) 8%, var(--color-card-bg))"
            : "var(--color-card-bg)",
          border: `1px solid ${flipped ? "var(--color-accent)" : "var(--color-card-border)"}`,
          minHeight: 240,
        }}
      >
        {flipped ? (
          <>
            <p className="text-sm text-tab-inactive mb-2">{item.word}</p>
            <p className="text-2xl font-bold text-accent">{item.meaning}</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-foreground mb-4">{item.word}</p>
            <p className="text-xs text-tab-inactive">{t("review.flipCard")}</p>
          </>
        )}
      </button>

      {/* 이전/다음 버튼 */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          disabled={current === 0}
          onClick={() => { setCurrent((c) => c - 1); setFlipped(false); }}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            backgroundColor: "var(--color-card-bg)",
            color: current === 0 ? "var(--color-tab-inactive)" : "var(--color-foreground)",
            border: "1px solid var(--color-card-border)",
            cursor: current === 0 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={16} />
          {t("review.prevCard")}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}
          >
            {t("review.reviewDone")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setCurrent((c) => c + 1); setFlipped(false); }}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}
          >
            {t("review.nextCard")}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
