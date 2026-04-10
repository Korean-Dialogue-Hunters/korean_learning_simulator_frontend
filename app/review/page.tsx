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
import { getSavedProfile, getUserId } from "@/hooks/useSetup";
import { getReviewCount, getWeeklyReview } from "@/lib/api";
import { addXp } from "@/lib/xpSystem";
import XpGainPopup, { type XpGainPopupProps } from "@/components/XpGainPopup";
import type { ReviewCountResponse, WeeklyReviewResponse, ChosungQuizItem, FlashcardItem } from "@/types/api";

type Mode = "list" | "quiz" | "flashcard";

export default function ReviewPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("list");
  const [counts, setCounts] = useState<ReviewCountResponse | null>(null);
  const [reviewData, setReviewData] = useState<WeeklyReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [xpPopup, setXpPopup] = useState<Omit<XpGainPopupProps, "onClose"> | null>(null);

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
    setMode(m);
    setLoading(true);
    setError("");
    try {
      const data = await getWeeklyReview(profile.userNickname);
      setReviewData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("review.loadFailed"));
      setMode("list");
    } finally {
      setLoading(false);
    }
  };

  /* 로딩 중 (모드 진입 후 데이터 대기) */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-tab-inactive text-sm">{t("review.loading")}</p>
      </div>
    );
  }

  const handleXpGain = (amount: number) => {
    const userId = getUserId();
    if (!userId || amount <= 0) return;
    const result = addXp(userId, amount);
    setXpPopup(result);
  };

  if (mode === "quiz" && reviewData) {
    return (
      <>
        {xpPopup && <XpGainPopup {...xpPopup} onClose={() => setXpPopup(null)} />}
        <ChosungQuizView items={reviewData.chosungQuiz} onBack={() => setMode("list")} onXpGain={handleXpGain} />
      </>
    );
  }

  if (mode === "flashcard" && reviewData) {
    return (
      <>
        {xpPopup && <XpGainPopup {...xpPopup} onClose={() => setXpPopup(null)} />}
        <FlashcardView items={reviewData.flashcards} onBack={() => setMode("list")} onXpGain={handleXpGain} />
      </>
    );
  }

  /* ── 모드 목록 화면 ── */
  const quizCount = counts?.chosungQuizCount ?? 0;
  const flashCount = counts?.flashcardCount ?? 0;

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

      <div className="flex flex-col gap-4">
        {/* 초성퀴즈 카드 */}
        <ModeCard
          icon={<Zap size={24} strokeWidth={2} />}
          title={t("review.chosungTitle")}
          desc={t("review.chosungDesc")}
          count={t("review.chosungCount", { count: quizCount })}
          onStart={() => startMode("quiz")}
        />

        {/* 플래시카드 카드 */}
        <ModeCard
          icon={<Layers size={24} strokeWidth={2} />}
          title={t("review.flashcardTitle")}
          desc={t("review.flashcardDesc")}
          count={t("review.flashcardCount", { count: flashCount })}
          onStart={() => startMode("flashcard")}
        />
      </div>
    </div>
  );
}

/* ── 모드 선택 카드 ── */
function ModeCard({
  icon, title, desc, count, onStart,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  count: string;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${COMMON_CLASSES.cardRounded} p-5`}
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
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
            onClick={onStart}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
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
function ChosungQuizView({ items, onBack, onXpGain }: { items: ChosungQuizItem[]; onBack: () => void; onXpGain?: (amount: number) => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  /* 데이터 없으면 생성 중 로딩 */
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-tab-inactive text-sm">{t("review.loading")}</p>
        <button onClick={onBack} className="text-sm text-accent underline mt-4">{t("review.backToList")}</button>
      </div>
    );
  }

  const item = items[current] as Record<string, unknown>;
  /* BE 필드 추출 — 문장형 문제 + 4지선다 */
  const sentence = (item.sentence as string) ?? (item.question as string) ?? "";
  const chosung = (item.chosung as string) ?? (item.quizId as string) ?? "?";
  const answer = (item.answer as string) ?? (item.word as string) ?? "";
  const choices = (item.choices as string[]) ?? [];
  const meaning = (item.meaning as string) ?? "";

  /* 정답 인덱스 */
  const correctIdx = choices.indexOf(answer);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (choices[idx] === answer) setCorrect((c) => c + 1);
  };

  const handleNext = () => {
    if (current + 1 >= items.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  /* 퀴즈 완료 시 XP 지급 */
  if (done && !xpAwarded && onXpGain) {
    const xp = correct * 5;
    if (xp > 0) onXpGain(xp);
    setXpAwarded(true);
  }

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
          <button onClick={() => { setCurrent(0); setCorrect(0); setDone(false); setSelected(null); setXpAwarded(false); }}
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

      {/* 문제 카드 */}
      <div className={`${COMMON_CLASSES.cardRounded} p-6 mb-6`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        {sentence && (
          <p className="text-sm text-foreground leading-relaxed mb-4">{sentence}</p>
        )}
        <p className="text-3xl font-black text-center tracking-[0.3em] text-foreground">{chosung}</p>
        {meaning && <p className="text-xs text-tab-inactive text-center mt-2">{meaning}</p>}
      </div>

      {/* 4지선다 */}
      {choices.length > 0 ? (
        <div className="flex flex-col gap-3">
          {choices.map((choice, idx) => {
            const isSelected = selected === idx;
            const isCorrectChoice = idx === correctIdx;
            const showResult = selected !== null;

            let bgColor = "var(--color-card-bg)";
            let borderColor = "var(--color-card-border)";
            let textColor = "var(--color-foreground)";

            if (showResult && isCorrectChoice) {
              bgColor = "color-mix(in srgb, #22C55E 12%, var(--color-card-bg))";
              borderColor = "#22C55E";
              textColor = "#22C55E";
            } else if (showResult && isSelected && !isCorrectChoice) {
              bgColor = "color-mix(in srgb, #DC3C3C 12%, var(--color-card-bg))";
              borderColor = "#DC3C3C";
              textColor = "#DC3C3C";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
                className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ backgroundColor: bgColor, border: `1.5px solid ${borderColor}`, color: textColor }}
              >
                <span className="font-bold mr-2">{idx + 1}.</span>
                {choice}
              </button>
            );
          })}

          {/* 다음 버튼 */}
          {selected !== null && (
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}
            >
              {current + 1 >= items.length ? t("review.quizComplete") : t("review.nextQuestion")}
            </button>
          )}
        </div>
      ) : (
        /* choices가 없는 경우 — 정답 공개 방식 폴백 */
        <div className="flex-1 flex flex-col items-center justify-center">
          {selected === null ? (
            <button onClick={() => setSelected(0)}
              className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
              {t("review.showAnswer")}
            </button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-2xl font-bold text-accent">{answer}</p>
              <button onClick={handleNext}
                className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
                {t("review.nextQuestion")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   플래시카드 뷰
   ══════════════════════════════════════════ */
function FlashcardView({ items, onBack, onXpGain }: { items: FlashcardItem[]; onBack: () => void; onXpGain?: (amount: number) => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-tab-inactive text-sm">{t("review.loading")}</p>
        <button onClick={onBack} className="text-sm text-accent underline mt-4">{t("review.backToList")}</button>
      </div>
    );
  }

  const raw = items[current] as Record<string, unknown>;
  /* BE 필드 대응: front/back 또는 word/meaning */
  const front = (raw.front as string) ?? (raw.word as string) ?? "";
  const back = (raw.back as string) ?? (raw.meaning as string) ?? "";
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
            <p className="text-sm text-tab-inactive mb-2">{front}</p>
            <p className="text-2xl font-bold text-accent">{back}</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-foreground mb-4">{front}</p>
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
            onClick={() => {
              if (onXpGain) onXpGain(items.length * 3);
              onBack();
            }}
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
