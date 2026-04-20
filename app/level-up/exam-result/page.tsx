"use client";

/* ──────────────────────────────────────────
   승급 시험 결과 페이지 (/level-up/exam-result)
   - /chat에서 시험 대화 종료 후 진입
   - POST /v1/sessions/{id}/exam 호출 → 통과 시 BE가 korean_level 자동 증가
   - 통과: 벨트 전후 비교 + 축하 UI
   - 실패: 다음 기회 안내
   - 완료 시 session 상태 + examMode 플래그 정리
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Trophy, XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { evaluateExamSession } from "@/lib/api";
import type { ExamResultResponse } from "@/types/api";
import LoadingScreen from "@/components/common/LoadingScreen";
import { getBelt } from "@/lib/belt";
import { clearSessionState } from "@/lib/sessionStorage";
import { getUserId } from "@/hooks/useSetup";
import { refreshProfileFromBE } from "@/lib/profileSync";
import { clearExamEligibilityCache } from "@/hooks/useExamEligibility";

export default function ExamResultPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [result, setResult] = useState<ExamResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      router.replace("/level-up");
      return;
    }
    evaluateExamSession(sessionId)
      .then(async (res) => {
        setResult(res);
        /* 통과 시 BE가 korean_level을 +1 했으므로 프로필 refetch해서
           TierCard/승급 탭이 최신 벨트 표시하도록 localStorage 캐시 갱신.
           시험이 끝났으면 응시 가능 캐시도 비워서 배지가 사라지게 함. */
        clearExamEligibilityCache();
        if (res.passed) {
          const userId = getUserId();
          if (userId) await refreshProfileFromBE(userId);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [router]);

  /* 닫기 → session/examMode 정리 후 승급 탭으로 복귀 */
  const handleDone = () => {
    clearSessionState();
    router.push("/level-up");
  };

  if (loading) return <LoadingScreen active variant="evaluation" />;

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-5 px-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, #DC3C3C 12%, transparent)", color: "#DC3C3C" }}
        >
          <AlertCircle size={32} strokeWidth={1.8} />
        </div>
        <p className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>
          {t("levelUp.examLoadFailed")}
        </p>
        <button
          type="button"
          onClick={handleDone}
          className="w-full max-w-[260px] py-3 rounded-2xl text-sm font-bold"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}
        >
          {t("levelUp.backToLevelUp")}
        </button>
      </div>
    );
  }

  const isKo = i18n.language?.startsWith("ko");
  const prevBelt = result.previousLevel ? getBelt(result.previousLevel) : null;
  const newBelt = result.newLevel ? getBelt(result.newLevel) : prevBelt;
  const accentColor = result.passed ? (newBelt?.color ?? "var(--color-accent)") : "#DC3C3C";

  return (
    <div
      className="flex flex-col min-h-[100dvh] px-5 pt-16 pb-24 overflow-y-auto"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* 중앙 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 16%, transparent)` }}
        >
          {result.passed ? (
            <Trophy size={52} strokeWidth={1.6} style={{ color: accentColor }} />
          ) : (
            <XCircle size={52} strokeWidth={1.6} style={{ color: accentColor }} />
          )}
        </div>

        <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-foreground)" }}>
          {result.passed ? t("levelUp.examPassTitle") : t("levelUp.examFailTitle")}
        </h1>

        <p
          className="text-sm leading-relaxed max-w-[320px]"
          style={{ color: "var(--color-tab-inactive)" }}
        >
          {result.message}
        </p>

        {/* 점수 */}
        <div
          className="px-5 py-3 rounded-2xl flex items-baseline gap-1.5"
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          <span className="text-[11px] text-tab-inactive mr-1">{t("levelUp.examScoreLabel")}</span>
          <span className="text-2xl font-bold" style={{ color: accentColor }}>
            {result.score.toFixed(1)}
          </span>
          <span className="text-xs text-tab-inactive">/ 10</span>
        </div>

        {/* 벨트 변화 (통과 시만) */}
        {result.passed && prevBelt && newBelt && (
          <div className="flex items-center gap-4 mt-2">
            {/* 이전 벨트 */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mb-1.5"
                style={{
                  border: `2px solid ${prevBelt.color}`,
                  backgroundColor: "var(--color-surface)",
                  opacity: 0.55,
                }}
              >
                <Image src={prevBelt.image} alt={prevBelt.name} width={42} height={42} />
              </div>
              <span className="text-[11px]" style={{ color: prevBelt.color, opacity: 0.7 }}>
                {isKo ? `${prevBelt.nameKo}띠` : `${prevBelt.name} Belt`}
              </span>
            </div>

            <span className="text-xl text-tab-inactive" aria-hidden>→</span>

            {/* 새 벨트 */}
            <div className="flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center mb-1.5"
                style={{
                  border: `2.5px solid ${newBelt.color}`,
                  backgroundColor: "var(--color-surface)",
                  boxShadow: `0 0 12px ${newBelt.color}55`,
                }}
              >
                <Image src={newBelt.image} alt={newBelt.name} width={52} height={52} />
              </div>
              <span className="text-[12px] font-bold" style={{ color: newBelt.color }}>
                {isKo ? `${newBelt.nameKo}띠` : `${newBelt.name} Belt`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <button
        type="button"
        onClick={handleDone}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98]"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "var(--color-btn-primary-text)",
        }}
      >
        <ArrowLeft size={16} strokeWidth={2.2} />
        {t("levelUp.backToLevelUp")}
      </button>
    </div>
  );
}
