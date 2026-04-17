"use client";

/* ──────────────────────────────────────────
   복습 페이지 (/review)
   - 초성퀴즈 / 플래시카드 두 가지 모드
   - GET /v1/users/{nickname}/review/weekly 로 콘텐츠 생성·조회
   - GET /v1/users/{nickname}/review/count 로 개수 표시
   ────────────────────────────────────────── */

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BookOpen, Zap, Layers, ArrowLeft, Check, X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { getSavedProfile, getUserId } from "@/hooks/useSetup";
import { getWeeklyReview, getUserSessions, submitQuizResult, submitFlashcardResult } from "@/lib/api";
import { addXp } from "@/lib/xpSystem";
import XpGainPopup, { type XpGainPopupProps } from "@/components/XpGainPopup";
import LoadingScreen from "@/components/common/LoadingScreen";
import type { WeeklyReviewResponse, ChosungQuizItem, FlashcardItem, UserSessionItem } from "@/types/api";
import { markQuizPassed, markFlashcardDone, getStarProgress } from "@/lib/starStorage";

type Mode = "list" | "quiz" | "flashcard";

/* 리뷰 대상 세션 요약 정보 */
interface ReviewSessionInfo {
  location: string;
  scenarioTitle: string;
  totalScore10: number;
  grade: string;
  createdAt: string;
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewPageInner />
    </Suspense>
  );
}

function ReviewPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("list");
  const [reviewData, setReviewData] = useState<WeeklyReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState("");
  const [xpPopup, setXpPopup] = useState<Omit<XpGainPopupProps, "onClose"> | null>(null);
  const autoStarted = useRef(false);
  const fromResult = useRef(false);

  /* 리뷰 대상 세션 (별 미완료 중 최저점) */
  const [targetSession, setTargetSession] = useState<UserSessionItem | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  /* 이번 진입에서 방금 완료한 항목 (UI 즉시 반영) */
  const [justPassedQuiz, setJustPassedQuiz] = useState(false);
  const [justDoneFlashcard, setJustDoneFlashcard] = useState(false);

  const profile = typeof window !== "undefined" ? getSavedProfile() : null;

  /* 1) 진입 시: 세션 목록 → 별 미완료 최저점 세션 찾기 */
  useEffect(() => {
    if (!profile) { setInitLoading(false); return; }

    const qsSessionId = searchParams.get("sessionId");
    if (qsSessionId) setSessionId(qsSessionId);
    else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("viewSessionId") || localStorage.getItem("sessionId");
      if (stored) setSessionId(stored);
    }

    getUserSessions(profile.userId, "score_low")
      .then((res) => {
        /* 퀴즈 또는 카드가 미완료인 세션만
           - BE 필드가 비어 있을 수 있어 localStorage 폴백까지 OR로 병합
             (history 카드와 동일 규칙 → 별 3개 다 찬 세션은 리뷰 대상에서 제외) */
        const incomplete = res.sessions.filter((s) => {
          const local = getStarProgress(s.sessionId);
          const quizDone = s.chosungQuizPassed ?? local.quizPassed ?? false;
          const flashDone = s.flashcardDone ?? local.flashcardDone ?? false;
          return !(quizDone && flashDone);
        });
        if (incomplete.length > 0) {
          setTargetSession(incomplete[0]);
          if (!qsSessionId) setSessionId(incomplete[0].sessionId);
        }
      })
      .catch(() => { /* 404: 신규 유저 → 세션 없음 */ })
      .finally(() => setInitLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 2) URL 쿼리로 바로 모드 진입 (initLoading 완료 후) */
  useEffect(() => {
    if (autoStarted.current || initLoading) return;
    const modeParam = searchParams.get("mode");
    if (modeParam === "quiz" || modeParam === "flashcard") {
      autoStarted.current = true;
      fromResult.current = true;
      startMode(modeParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initLoading]);

  /* 모드 시작 → 데이터 로드
     - URL/target 기반 sessionId를 BE에 전달 → 해당 세션의 콘텐츠만 반환
     - BE Option A 적용 전에는 서버가 sessionId 무시해도 안전 */
  const startMode = async (m: "quiz" | "flashcard") => {
    if (!profile) return;
    setMode(m);
    setLoading(true);
    setError("");
    try {
      const data = await getWeeklyReview(profile.userId, sessionId ?? undefined);
      setReviewData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("review.loadFailed"));
      setMode("list");
    } finally {
      setLoading(false);
    }
  };

  if (loading || initLoading) {
    return <LoadingScreen active variant="review" />;
  }

  const handleBack = () => {
    if (fromResult.current) {
      router.back();
    } else {
      setMode("list");
    }
  };

  const handleXpGain = (amount: number) => {
    const userId = getUserId();
    if (!userId || amount <= 0) return;
    const result = addXp(userId, amount);
    setXpPopup(result);
  };

  /* 별을 저장할 세션 ID 후보들 모으기
     - startMode에서 sessionId가 justBeforeSession으로 덮어써질 수 있어
       history 카드의 record.sessionId와 달라지는 경우가 있음.
     - URL/targetSession까지 모두 커버해 별이 유실되지 않게 함. */
  const collectStarSessionIds = () => {
    const ids = new Set<string>();
    if (sessionId) ids.add(sessionId);
    const qs = searchParams.get("sessionId");
    if (qs) ids.add(qs);
    if (targetSession?.sessionId) ids.add(targetSession.sessionId);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("viewSessionId") || localStorage.getItem("sessionId");
      if (stored) ids.add(stored);
    }
    return ids;
  };

  /* 퀴즈 완료 → BE 저장 + 정답률 75% 이상이면 별 즉시 반영 */
  const handleQuizComplete = async (correctCount: number, totalCount: number) => {
    const passed = totalCount > 0 && correctCount / totalCount >= 0.75;
    if (passed) {
      setJustPassedQuiz(true);
      collectStarSessionIds().forEach(markQuizPassed);
    }
    if (!profile || !sessionId) return;
    try {
      await submitQuizResult(profile.userId, sessionId, correctCount);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Review] quiz-result 저장 실패:", e);
      }
    }
  };

  /* 플래시카드 완료 → BE 저장 + 별 즉시 반영 + localStorage 저장 */
  const handleFlashcardComplete = async (completedCount: number) => {
    setJustDoneFlashcard(true);
    collectStarSessionIds().forEach(markFlashcardDone);
    if (!profile || !sessionId) return;
    try {
      await submitFlashcardResult(profile.userId, sessionId, completedCount);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Review] flashcard-result 저장 실패:", e);
      }
    }
  };

  if (mode === "quiz" && reviewData) {
    return (
      <>
        {xpPopup && <XpGainPopup {...xpPopup} onClose={() => setXpPopup(null)} />}
        <ChosungQuizView items={reviewData.chosungQuiz} onBack={handleBack} onXpGain={handleXpGain} onComplete={(c, t) => handleQuizComplete(c, t)} fromResult={fromResult.current} />
      </>
    );
  }

  if (mode === "flashcard" && reviewData) {
    return (
      <>
        {xpPopup && <XpGainPopup {...xpPopup} onClose={() => setXpPopup(null)} />}
        <FlashcardView items={reviewData.flashcards} onBack={handleBack} onXpGain={handleXpGain} onComplete={handleFlashcardComplete} />
      </>
    );
  }

  /* ── 모드 목록 화면 ──
     - BE 필드 우선, 미수신 시 localStorage 폴백까지 확인 (히스토리 카드와 동일) */
  const targetLocal = targetSession ? getStarProgress(targetSession.sessionId) : {};
  const quizDone = justPassedQuiz || (targetSession?.chosungQuizPassed ?? targetLocal.quizPassed ?? false);
  const flashDone = justDoneFlashcard || (targetSession?.flashcardDone ?? targetLocal.flashcardDone ?? false);
  const allDone = !targetSession || (quizDone && flashDone);

  const gradeMatch = targetSession?.grade?.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : targetSession?.grade ?? "";
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={22} strokeWidth={2} className="text-accent" />
        <h1 className="text-xl font-bold text-foreground">{t("review.title")}</h1>
      </div>
      <p className="text-sm text-tab-inactive mb-6">{t("review.subtitle")}</p>

      {error && (
        <p className="text-sm text-center mb-4" style={{ color: "#DC3C3C" }}>{error}</p>
      )}

      {/* 대상 세션 정보 */}
      {targetSession && !allDone && (
        <div className={`${COMMON_CLASSES.cardRounded} p-4 mb-6`}
          style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} strokeWidth={2} className="text-accent" />
              <span className="text-[11px] font-medium text-accent">{targetSession.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-tab-inactive">{targetSession.totalScore10.toFixed(1)} / 10</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ border: `1.5px solid ${gradeColor}`, color: gradeColor }}>
                {gradeCode}
              </span>
            </div>
          </div>
          <p className="text-[12px] font-bold text-foreground leading-snug">{targetSession.scenarioTitle}</p>
        </div>
      )}

      {allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}>
            <Check size={32} strokeWidth={2} />
          </div>
          <p className="text-sm text-tab-inactive text-center">{t("review.allDone")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ModeCard
            icon={<Zap size={24} strokeWidth={2} />}
            title={t("review.chosungTitle")}
            desc={t("review.chosungDesc")}
            done={quizDone}
            onStart={() => startMode("quiz")}
          />
          <ModeCard
            icon={<Layers size={24} strokeWidth={2} />}
            title={t("review.flashcardTitle")}
            desc={t("review.flashcardDesc")}
            done={flashDone}
            onStart={() => startMode("flashcard")}
          />
        </div>
      )}
    </div>
  );
}

/* ── 모드 선택 카드 (done=true 이면 완료 표시 + 비활성) ── */
function ModeCard({
  icon, title, desc, done, onStart,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  done: boolean;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${COMMON_CLASSES.cardRounded} p-5`}
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        opacity: done ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: done
              ? "color-mix(in srgb, #22C55E 12%, transparent)"
              : "color-mix(in srgb, var(--color-accent) 12%, transparent)",
            color: done ? "#22C55E" : "var(--color-accent)",
          }}
        >
          {done ? <Check size={24} strokeWidth={2} /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {done && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "color-mix(in srgb, #22C55E 15%, transparent)", color: "#22C55E" }}>
                {t("review.reviewDone")}
              </span>
            )}
          </div>
          <p className="text-xs text-tab-inactive leading-relaxed mb-3">{desc}</p>
          {!done && (
            <button
              type="button"
              onClick={onStart}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}
            >
              {t("review.startBtn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   초성 퀴즈 뷰
   ══════════════════════════════════════════ */
function ChosungQuizView({ items, onBack, onXpGain, onComplete, fromResult }: { items: ChosungQuizItem[]; onBack: () => void; onXpGain?: (amount: number) => void; onComplete?: (correctCount: number, totalCount: number) => Promise<void> | void; fromResult?: boolean }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  /* 데이터 없으면 생성 중 로딩 */
  if (items.length === 0) {
    return (
      <LoadingScreen active variant="review">
        <button onClick={onBack} className="text-sm text-accent underline mt-4">{t("common.goBack")}</button>
      </LoadingScreen>
    );
  }

  const item = items[current] as Record<string, unknown>;
  if (process.env.NODE_ENV !== "production") {
    console.log("[ChosungQuiz] item keys:", Object.keys(item), "item:", item);
  }
  /* BE 필드 추출 — 문장형 문제 + 4지선다 */
  const rawSentence = (item.sentence as string) ?? (item.question as string) ?? "";
  /* BE가 지문 안내 문구를 sentence에 포함시킬 수 있으므로 제거 — 예문만 남김 */
  const sentence = rawSentence
    .replace(/다음은 앞에서 나온 대화 문장입니다\.?\s*/g, "")
    .replace(/초성으로 바뀐 부분에 들어갈 원래 단어는 무엇인가요\??\s*/g, "")
    .trim();
  /* 초성: BE 필드 or 예문에서 자모만 추출 (ㄱ-ㅎ 연속) */
  const rawChosung = (item.chosung as string) ?? (item.quiz_id as string) ?? (item.quizId as string) ?? "";
  const chosung = rawChosung || (sentence.match(/[ㄱ-ㅎ]{2,}/)?.[0] ?? "");
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

  /* 퀴즈 완료 시 XP 지급 + BE 결과 저장 */
  if (done && !xpAwarded) {
    if (onXpGain) {
      const xp = correct * 5;
      if (xp > 0) onXpGain(xp);
    }
    if (onComplete) onComplete(correct, items.length);
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
            {t(fromResult ? "review.backToResult" : "review.backToReview")}
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
        <span>{t("common.goBack")}</span>
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

      {/* 문제 지문 */}
      <div className="mb-4 px-1">
        <p className="text-sm font-medium text-foreground leading-relaxed">
          다음은 앞에서 나온 대화 문장입니다.
          <br />
          초성으로 바뀐 부분에 들어갈 원래 단어는 무엇인가요?
        </p>
      </div>

      {/* 출제 문장 + 초성 */}
      <div className={`${COMMON_CLASSES.cardRounded} p-6 mb-6 flex flex-col items-center justify-center`}
        style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
        {sentence && (
          <p className="text-base font-medium leading-relaxed text-center text-foreground">
            &ldquo;{sentence}&rdquo;
          </p>
        )}
        <div className="mt-4 pt-4 border-t w-full flex items-center justify-center min-h-[80px]" style={{ borderColor: "var(--color-card-border)" }}>
          {selected !== null ? (
            <p className="text-4xl font-black text-center" style={{ color: "var(--color-accent)" }}>{answer}</p>
          ) : (
            <p className="text-4xl font-black text-center text-foreground">{chosung}</p>
          )}
        </div>
        {meaning && <p className="text-xs text-tab-inactive text-center">{meaning}</p>}
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
function FlashcardView({ items, onBack, onXpGain, onComplete }: { items: FlashcardItem[]; onBack: () => void; onXpGain?: (amount: number) => void; onComplete?: (completedCount: number) => Promise<void> | void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (items.length === 0) {
    return (
      <LoadingScreen active variant="review">
        <button onClick={onBack} className="text-sm text-accent underline mt-4">{t("common.goBack")}</button>
      </LoadingScreen>
    );
  }

  const raw = items[current] as Record<string, unknown>;
  const word = (raw.word as string) ?? "";
  const meaning = (raw.meaning as string) ?? "";
  const example = (raw.example as string) ?? "";
  const exampleTranslation = (raw.exampleTranslation as string) ?? (raw.example_translation as string) ?? "";
  const isLast = current === items.length - 1;

  /* example 문장 내 word를 <mark>로 하이라이트 */
  const highlightWord = (text: string, target: string) => {
    if (!text || !target) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(target.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold" style={{ color: "var(--color-accent)" }}>{text.slice(idx, idx + target.length)}</span>
        {text.slice(idx + target.length)}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70">
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("common.goBack")}</span>
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
            <p className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>{meaning}</p>
            {exampleTranslation && (
              <p className="text-sm text-tab-inactive leading-relaxed mt-4">{highlightWord(exampleTranslation, meaning)}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>{word}</p>
            {example && (
              <p className="text-sm text-tab-inactive leading-relaxed mt-4">{highlightWord(example, word)}</p>
            )}
            <p className="text-[13px] text-tab-inactive mt-6">{t("review.flipCard")}</p>
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
            onClick={async () => {
              if (onComplete) await onComplete(items.length);
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
            {t("review.memorizeBtn")}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
