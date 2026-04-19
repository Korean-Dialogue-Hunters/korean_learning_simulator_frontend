"use client";

/* ──────────────────────────────────────────
   승급 페이지 (/level-up)
   - 현재 korean_level 벨트 + 다음 벨트 미리보기
   - 승급 조건 3가지를 BE eligibility API 기준으로 시각화
     ① 현재 레벨 세션 수 ≥ requiredSessions
     ② 평균 점수 ≥ requiredScore
     ③ 승급 시험 (BE 미구현 — pending)
   - BE 실패 시 프로필 기반으로 최소 렌더 + 에러 배너
   ────────────────────────────────────────── */

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Award, ChevronRight, Lock, Check, X, Clock, AlertCircle } from "lucide-react";
import { isSetupDone, getSavedProfile } from "@/hooks/useSetup";
import { getBelt } from "@/lib/belt";
import { mapKoreanLevel } from "@/lib/koreanLevel";
import { getLevelUpEligibility } from "@/lib/api";
import type { LevelUpEligibilityResponse } from "@/types/api";

export default function LevelUpPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [eligibility, setEligibility] = useState<LevelUpEligibilityResponse | null>(null);
  const [fallbackLevel, setFallbackLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isSetupDone()) {
      router.replace("/setup");
      return;
    }
    const profile = getSavedProfile();
    if (!profile) {
      setLoading(false);
      return;
    }
    setFallbackLevel(mapKoreanLevel(profile.koreanLevel));

    getLevelUpEligibility(profile.userId)
      .then((res) => setEligibility(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [router]);

  /* BE 값 우선, 미수신 시 프로필/기본값 폴백 */
  const currentLevel = eligibility?.currentLevel ?? fallbackLevel;
  const nextLevelRaw = eligibility?.nextLevel ?? Math.min(currentLevel + 1, 6);
  const isMaxLevel = currentLevel >= 6;
  const nextLevel = isMaxLevel ? currentLevel : nextLevelRaw;

  const completedCount = eligibility?.completedSessions ?? 0;
  const requiredSessions = eligibility?.requiredSessions ?? 5;
  const avgScore = eligibility?.averageScore ?? 0;
  const requiredScore = eligibility?.requiredScore ?? 8.0;

  const meetSessions = completedCount >= requiredSessions;
  const meetScore = meetSessions && avgScore >= requiredScore;
  /* 시험 자격 = BE eligible 값을 최우선, 최고 레벨은 차단 */
  const eligibleForExam = !isMaxLevel && (eligibility?.eligible ?? false);

  const currentBelt = getBelt(currentLevel);
  const nextBelt = getBelt(nextLevel);

  const isKo = i18n.language?.startsWith("ko");
  const currentBeltLabel = isKo ? `${currentBelt.nameKo}띠` : `${currentBelt.name} Belt`;
  const nextBeltLabel = isKo ? `${nextBelt.nameKo}띠` : `${nextBelt.name} Belt`;

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <h1 className="text-xl font-bold text-foreground mb-1">{t("levelUp.title")}</h1>
      <p className="text-[12px] text-tab-inactive mb-5">{t("levelUp.subtitle")}</p>

      {/* BE 조회 실패 배너 */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4"
          style={{
            backgroundColor: "color-mix(in srgb, #DC3C3C 10%, transparent)",
            border: "1px solid color-mix(in srgb, #DC3C3C 30%, transparent)",
          }}
        >
          <AlertCircle size={14} strokeWidth={2} style={{ color: "#DC3C3C" }} />
          <span className="text-[11.5px]" style={{ color: "#DC3C3C" }}>
            {t("levelUp.loadFailed")}
          </span>
        </div>
      )}

      {/* 현재 → 다음 벨트 비교 카드 */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <div className="flex items-center justify-between">
          {/* 현재 벨트 */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-tab-inactive mb-2">{t("levelUp.currentLevel")}</span>
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-2"
              style={{ border: `2px solid ${currentBelt.color}`, backgroundColor: "var(--color-surface)" }}
            >
              <Image src={currentBelt.image} alt={currentBelt.name} width={44} height={44} />
            </div>
            <span className="text-[12px] font-bold" style={{ color: currentBelt.color }}>
              {currentBeltLabel}
            </span>
          </div>

          {/* 화살표 */}
          <ChevronRight size={24} className="text-tab-inactive shrink-0 mx-2" />

          {/* 다음 벨트 */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-tab-inactive mb-2">{t("levelUp.nextLevel")}</span>
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-2 relative"
              style={{
                border: `2px dashed ${nextBelt.color}`,
                backgroundColor: "var(--color-surface)",
                opacity: isMaxLevel ? 0.35 : 0.7,
              }}
            >
              <Image src={nextBelt.image} alt={nextBelt.name} width={44} height={44} />
            </div>
            <span className="text-[12px] font-bold" style={{ color: nextBelt.color, opacity: isMaxLevel ? 0.5 : 1 }}>
              {isMaxLevel ? t("levelUp.maxLevel") : nextBeltLabel}
            </span>
          </div>
        </div>

        {/* 상태 배지 (최고 레벨 / 자격 충족 / 미충족) */}
        {!loading && (
          <div
            className="mt-4 py-2 px-3 rounded-lg text-center text-[12px] font-bold"
            style={{
              backgroundColor: isMaxLevel
                ? "var(--color-surface)"
                : eligibleForExam
                  ? `${currentBelt.color}22`
                  : "var(--color-surface)",
              color: isMaxLevel
                ? "var(--color-tab-inactive)"
                : eligibleForExam
                  ? currentBelt.color
                  : "var(--color-tab-inactive)",
            }}
          >
            {isMaxLevel
              ? t("levelUp.maxLevelNote")
              : eligibleForExam
                ? t("levelUp.eligibleBadge")
                : t("levelUp.notEligibleBadge")}
          </div>
        )}
      </div>

      {/* 승급 조건 체크리스트 */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <p className="text-[13px] font-bold text-foreground mb-4">{t("levelUp.requirementsTitle")}</p>

        <div className="flex flex-col gap-4">
          {/* 조건 1: 세션 수 */}
          <RequirementRow
            status={loading ? "loading" : meetSessions ? "met" : "unmet"}
            label={t("levelUp.reqSessions")}
            progressLabel={t("levelUp.reqSessionsProgress", {
              current: completedCount,
              required: requiredSessions,
            })}
            progressPercent={Math.min((completedCount / Math.max(requiredSessions, 1)) * 100, 100)}
            barColor={currentBelt.color}
          />

          {/* 조건 2: 평균 점수 */}
          <RequirementRow
            status={loading ? "loading" : !meetSessions ? "locked" : meetScore ? "met" : "unmet"}
            label={t("levelUp.reqScore")}
            progressLabel={t("levelUp.reqScoreProgress", {
              current: avgScore.toFixed(1),
              required: requiredScore.toFixed(1),
            })}
            progressPercent={Math.min((avgScore / Math.max(requiredScore, 0.1)) * 100, 100)}
            barColor={currentBelt.color}
            disabled={!meetSessions}
          />

          {/* 조건 3: 승급 시험 (BE 미구현 → 항상 pending) */}
          <RequirementRow
            status={!eligibleForExam ? "locked" : "pending"}
            label={t("levelUp.reqExam")}
            progressLabel={!eligibleForExam ? t("levelUp.reqExamLocked") : t("levelUp.reqExamPending")}
            disabled={!eligibleForExam}
          />
        </div>
      </div>

      {/* 응시 버튼 (BE 준비 중 → 비활성) */}
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px]"
        style={{
          backgroundColor: eligibleForExam ? `${currentBelt.color}22` : "var(--color-surface)",
          color: eligibleForExam ? currentBelt.color : "var(--color-tab-inactive)",
          border: `1px solid ${eligibleForExam ? currentBelt.color : "var(--color-card-border)"}`,
          cursor: "not-allowed",
        }}
      >
        <Lock size={16} strokeWidth={2.2} />
        {isMaxLevel ? t("levelUp.maxLevelNote") : t("levelUp.comingSoon")}
      </button>

      {/* 안내 문구 */}
      <p className="text-[11px] text-center text-tab-inactive mt-3 leading-relaxed">
        <Award size={12} className="inline-block mr-1 mb-[2px]" />
        {t("levelUp.systemNote")}
      </p>
    </div>
  );
}

/* ── 조건 1행: 상태 아이콘 + 진척도 바 ── */
type RowStatus = "met" | "unmet" | "locked" | "pending" | "loading";

function RequirementRow({
  status,
  label,
  progressLabel,
  progressPercent,
  barColor,
  disabled = false,
}: {
  status: RowStatus;
  label: string;
  progressLabel: string;
  progressPercent?: number;
  barColor?: string;
  disabled?: boolean;
}) {
  const icon = (() => {
    if (status === "met") return <Check size={14} strokeWidth={3} style={{ color: "#fff" }} />;
    if (status === "unmet") return <X size={14} strokeWidth={3} style={{ color: "#fff" }} />;
    if (status === "pending") return <Clock size={14} strokeWidth={2.5} style={{ color: "#fff" }} />;
    return <Lock size={12} strokeWidth={2.5} style={{ color: "var(--color-tab-inactive)" }} />;
  })();

  const iconBg = (() => {
    if (status === "met") return barColor ?? "var(--color-accent)";
    if (status === "unmet") return "#DC3C3C";
    if (status === "pending") return "var(--color-accent)";
    return "var(--color-surface)";
  })();

  return (
    <div className="flex flex-col gap-1.5" style={{ opacity: disabled ? 0.45 : 1 }}>
      <div className="flex items-center gap-2.5">
        {/* 상태 아이콘 */}
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: iconBg,
            border: status === "locked" ? "1px solid var(--color-card-border)" : "none",
          }}
        >
          {icon}
        </div>

        {/* 라벨 + 진행값 */}
        <div className="flex-1 flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-foreground leading-tight">{label}</span>
          <span className="text-[11px] text-tab-inactive font-medium shrink-0">{progressLabel}</span>
        </div>
      </div>

      {/* 진행 바 (있는 경우에만) */}
      {typeof progressPercent === "number" && (
        <div
          className="h-1.5 rounded-full overflow-hidden ml-[30px]"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: barColor ?? "var(--color-accent)",
            }}
          />
        </div>
      )}
    </div>
  );
}
