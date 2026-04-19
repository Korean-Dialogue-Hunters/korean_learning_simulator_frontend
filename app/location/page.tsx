"use client";

/* ──────────────────────────────────────────
   장소 선택 페이지 (/location) — TODO 25~29
   - LOCATION_OPTIONS 배열 기반 동적 렌더링
   - MVP: 한강만 활성화, 나머지 비활성(흐리게)
   - 선택된 장소 강조 표시
   - 선택 완료 → 시나리오 생성 API 호출 → /persona 이동

   🔗 연동: POST /v1/sessions → 세션 생성 + 페르소나 수신
   ────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import { LOCATION_OPTIONS, LocationId } from "@/types/setup";
import { getSavedProfile } from "@/hooks/useSetup";
import { createSession, createExamSession } from "@/lib/api";
import LoadingScreen from "@/components/common/LoadingScreen";
import { getLocationImage } from "@/lib/locationImage";
import { clearSessionState } from "@/lib/sessionStorage";

export default function LocationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  /* 승급 시험 모드 — /level-up에서 examMode 플래그를 세팅하고 넘어옴.
     clearSessionState()가 플래그를 지우므로 보존 후 복원. */
  const [isExamMode, setIsExamMode] = useState(false);
  useEffect(() => {
    setIsExamMode(typeof window !== "undefined" && localStorage.getItem("examMode") === "true");
  }, []);

  /* 룰렛 상태 — examMode일 때만 활성. rouletteIdx는 현재 하이라이트된 카드 idx,
     rouletteWinner는 최종 당첨(정착) 카드. 둘 다 LOCATION_OPTIONS 기준 인덱스. */
  const [rouletteIdx, setRouletteIdx] = useState<number | null>(null);
  const [rouletteWinner, setRouletteWinner] = useState<number | null>(null);
  const rouletteStartedRef = useRef(false);

  const LOCATION_DESC: Record<string, string> = {
    "한강": t("location.hangang_desc"),
    "명동": t("location.myeongdong_desc"),
    "롯데월드": t("location.lotteworld_desc"),
    "남산": t("location.namsan_desc"),
  };

  const handlePick = async (locId: LocationId) => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      /* localStorage에서 셋업 프로필 가져오기 */
      const profile = getSavedProfile();
      if (!profile) {
        router.replace("/setup");
        return;
      }

      /* 이전 in-flow 세션 키 초기화 (새 세션 시작 전 스테이트 청소).
         examMode 플래그는 clearSessionState에서 지워지므로 호출 후 복원. */
      clearSessionState();

      /* examMode면 시험 전용 엔드포인트 호출 (BE가 현재 레벨 +1 난이도로 시나리오 준비).
         응답 스키마는 동일하므로 이후 플로우는 공유. */
      const res = isExamMode
        ? await createExamSession(profile.userId, locId)
        : await createSession({
            userId: profile.userId,
            userNickname: profile.userNickname,
            country: profile.country,
            koreanLevel: profile.koreanLevel,
            culturalInterest: profile.culturalInterest,
            location: locId,
          });

      /* 세션 데이터를 localStorage에 저장 (역할 선택 페이지에서 사용) */
      localStorage.setItem("sessionId", res.sessionId);
      localStorage.setItem("scenarioData", JSON.stringify(res));
      /* 시험 모드 플래그는 /chat → /level-up/exam-result 경로에서 다시 필요하므로 복원 */
      if (isExamMode) localStorage.setItem("examMode", "true");

      router.push("/persona");
    } catch (e) {
      setError(e instanceof Error ? e.message : "세션 생성에 실패했습니다");
      setIsLoading(false);
      /* 룰렛 중 실패하면 하이라이트를 거둬 페이지 상태를 정적으로. 복구는 상단 뒤로가기로. */
      if (isExamMode) {
        setRouletteIdx(null);
        setRouletteWinner(null);
      }
    }
  };

  /* 뒤로가기 — examMode 플래그를 정리해야 다음 번 /level-up→응시 흐름이 다시 깨끗하게 시작됨 */
  const handleBack = () => {
    if (typeof window !== "undefined") localStorage.removeItem("examMode");
    router.push(isExamMode ? "/level-up" : "/");
  };

  /* examMode 진입 시 룰렛 가동 — 활성 장소 중 무작위 1곳을 뽑아 가속→감속 하이라이트 순회 후
     정착. 정착 후 홀드(1500ms) 동안 당첨 카드를 크게 부각한 뒤 handlePick 자동 호출. */
  useEffect(() => {
    if (!isExamMode) return;
    if (rouletteStartedRef.current) return;
    rouletteStartedRef.current = true;

    const active = LOCATION_OPTIONS
      .map((loc, i) => ({ loc, i }))
      .filter((x) => x.loc.available);
    if (active.length === 0) return;

    const winner = active[Math.floor(Math.random() * active.length)];

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (reduced) {
      setRouletteIdx(winner.i);
      setRouletteWinner(winner.i);
      timeouts.push(setTimeout(() => handlePick(winner.loc.id as LocationId), 1200));
      return () => timeouts.forEach(clearTimeout);
    }

    /* 가속→감속 스케줄: 총 ~2.1초. 시작 빠름(90ms) → 점점 느려짐(420ms)
       정착은 winner 인덱스에서 멈추도록 사이클 카운트를 조정. */
    const steps: number[] = [];
    const intervals = [90, 90, 90, 100, 110, 130, 160, 200, 250, 320, 420];
    /* active 인덱스들을 순환시키되 마지막이 winner가 되게 경로 구성 */
    const winnerActiveIdx = active.findIndex((x) => x.i === winner.i);
    for (let k = 0; k < intervals.length; k++) {
      steps.push(active[(k + winnerActiveIdx - (intervals.length - 1) + active.length * 10) % active.length].i);
    }

    let acc = 0;
    steps.forEach((targetIdx, k) => {
      acc += intervals[k];
      timeouts.push(
        setTimeout(() => {
          setRouletteIdx(targetIdx);
          if (k === steps.length - 1) {
            setRouletteWinner(targetIdx);
            timeouts.push(
              setTimeout(() => handlePick(LOCATION_OPTIONS[targetIdx].id as LocationId), 1500),
            );
          }
        }, acc),
      );
    });

    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamMode]);

  return (
    <div className="flex flex-col h-[100dvh] px-5 pt-14 pb-6 overflow-hidden" style={{ backgroundColor: "var(--color-background)" }}>
      <LoadingScreen active={isLoading} variant="scenario" />
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-3 self-start hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("common.back")}</span>
      </button>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          {isExamMode ? (
            <Sparkles size={18} strokeWidth={2} className="text-accent animate-pulse" />
          ) : (
            <MapPin size={18} strokeWidth={2} className="text-accent" />
          )}
          <h1 className="text-lg font-extrabold text-foreground">
            {isExamMode
              ? rouletteWinner !== null
                ? t("location.examRouletteDone", { location: LOCATION_OPTIONS[rouletteWinner].label.split(" - ")[0] })
                : t("location.examRouletteTitle")
              : t("location.title")}
          </h1>
        </div>
        <p className="text-xs text-tab-inactive">
          {isExamMode ? t("location.examRouletteSubtitle") : t("location.subtitle")}
        </p>
      </div>

      {/* 장소 카드 목록 — 탭 즉시 선택 + 세션 생성 */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {LOCATION_OPTIONS.map((loc, idx) => {
          const isDisabled = !loc.available;
          const img = getLocationImage(loc.id);
          const isHighlighted = isExamMode && rouletteIdx === idx;
          const isWinner = isExamMode && rouletteWinner === idx;
          const dimmedByRoulette = isExamMode && rouletteIdx !== null && rouletteIdx !== idx && rouletteWinner === null;
          const losingInWinnerPhase = isExamMode && rouletteWinner !== null && rouletteWinner !== idx;

          return (
            <button
              key={loc.id}
              type="button"
              disabled={isDisabled || isLoading || isExamMode}
              onClick={() => !isDisabled && !isExamMode && handlePick(loc.id)}
              className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
              style={{
                border: isWinner
                  ? "3px solid var(--color-accent)"
                  : "1px solid var(--color-card-border)",
                opacity: isDisabled ? 0.5 : losingInWinnerPhase ? 0.25 : dimmedByRoulette ? 0.45 : 1,
                cursor: isDisabled || isExamMode ? "default" : "pointer",
                transform: isWinner ? "scale(1.04)" : isHighlighted ? "scale(1.02)" : losingInWinnerPhase ? "scale(0.97)" : "scale(1)",
                boxShadow: isWinner
                  ? "0 0 0 6px color-mix(in srgb, var(--color-accent) 40%, transparent), 0 12px 40px color-mix(in srgb, var(--color-accent) 45%, transparent)"
                  : isHighlighted
                    ? "0 0 0 3px color-mix(in srgb, var(--color-accent) 45%, transparent)"
                    : "none",
                transitionDuration: isWinner ? "450ms" : "180ms",
                zIndex: isWinner ? 2 : 1,
              }}
            >
              {/* 배경 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={loc.label}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: isDisabled ? "grayscale(0.7)" : "none" }}
              />

              {/* 하단 그라데이션 */}
              <div
                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)" }}
              />

              {/* 우상단 비활성 뱃지 */}
              {isDisabled && (
                <span
                  className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-md"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  {t("common.comingSoon")}
                </span>
              )}

              {/* 룰렛 당첨 뱃지 — 정착 후 진입 전까지 크게 노출 */}
              {isWinner && (
                <span
                  className="absolute top-3 right-3 flex items-center gap-1 text-[12px] font-extrabold px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "#fff",
                    boxShadow: "0 4px 16px color-mix(in srgb, var(--color-accent) 45%, transparent)",
                    animation: "pulse 1.2s ease-in-out infinite",
                  }}
                >
                  <Sparkles size={12} strokeWidth={2.5} />
                  {t("location.startHere")}
                </span>
              )}

              {/* 좌하단 텍스트 */}
              <div className="absolute bottom-4 left-5 right-5 text-left">
                <p className="font-extrabold text-[18px] mb-1"
                  style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
                  {loc.label}
                </p>
                <p className="text-[12px] font-medium leading-relaxed line-clamp-2"
                  style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                  {LOCATION_DESC[loc.id]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 에러 메시지 — 복구는 상단 뒤로가기 버튼으로 */}
      {error && (
        <p className="text-sm text-center mt-3" style={{ color: "#DC3C3C" }}>{error}</p>
      )}
    </div>
  );
}
