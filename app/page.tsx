"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronRight, MessageCircle } from "lucide-react";
import HomeHeader from "@/components/HomeHeader";
import TierCard from "@/components/TierCard";
import WeeklyStats from "@/components/WeeklyStats";
import { UserProfile, WeeklyStats as WeeklyStatsType, Grade } from "@/types/user";
import { isSetupDone, getSavedProfile, getUserId } from "@/hooks/useSetup";
import { getWeeklyStats, getUserSessions } from "@/lib/api";
import { getXpData, getXpBarInfo } from "@/lib/xpSystem";
import { getEffectiveKoreanLevel, refreshProfileFromBE } from "@/lib/profileSync";
import { useTutorial, isTutorialDone } from "@/hooks/useTutorial";
import TutorialOverlay from "@/components/tutorial/TutorialOverlay";

/* grade 문자열("초급 <B>")에서 Grade 타입으로 매핑 */
function parseGrade(raw: string): Grade {
  const m = raw.match(/<(\w+)>/);
  const code = m ? m[1] : raw;
  if (["S", "A", "B", "C"].includes(code)) return code as Grade;
  return "C";
}

/* 주간 통계 localStorage 캐시 — 재방문 시 스켈레톤 없이 즉시 렌더 후 백그라운드 갱신 (SWR 패턴) */
const WEEKLY_STATS_CACHE_KEY = "weeklyStatsCache";
type CachedStats = { userId: string; stats: WeeklyStatsType };

function readCachedStats(userId: string): WeeklyStatsType | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WEEKLY_STATS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStats;
    if (parsed.userId !== userId) return null;
    return parsed.stats;
  } catch {
    return null;
  }
}

function writeCachedStats(userId: string, stats: WeeklyStatsType) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WEEKLY_STATS_CACHE_KEY, JSON.stringify({ userId, stats }));
  } catch {}
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsType | null>(null);
  const tutorial = useTutorial();
  const { startTutorial } = tutorial;

  /* 첫 접속 시 튜토리얼 자동 시작 — 셋업 완료 + 아직 튜토리얼 미완료
     dep는 안정 참조(startTutorial)만 사용: tutorial 객체 자체를 dep로 두면
     매 렌더마다 effect가 재실행되어 250ms 뒤 currentStep을 0으로 리셋시킴 */
  useEffect(() => {
    if (!isSetupDone() || isTutorialDone()) return;
    const id = window.setTimeout(startTutorial, 250);
    return () => window.clearTimeout(id);
  }, [startTutorial]);

  useEffect(() => {
    if (!isSetupDone()) {
      router.replace("/setup");
      return;
    }
    const profile = getSavedProfile();
    if (!profile) return;

    /* 프로필 기본값 세팅 (XP는 localStorage에서 읽기) */
    const userId = getUserId();
    const xpData = userId ? getXpData(userId) : { totalXp: 0 };
    const bar = getXpBarInfo(xpData.totalXp);
    setUser({
      userNickname: profile.userNickname,
      grade: "C",
      /* 시험 통과/자동 강등 이후 갱신된 override 우선, 없으면 셋업값 매핑 */
      koreanLevel: getEffectiveKoreanLevel(),
      level: bar.level,
      xp: bar.currentLevelXp,
      xpMax: bar.requiredLevelXp,
      xpToNext: bar.requiredLevelXp - bar.currentLevelXp,
    });

    /* BE에서 최신 korean_level 동기화 → 성공 시 TierCard 즉시 재렌더 */
    refreshProfileFromBE(profile.userId).then((lvl) => {
      if (typeof lvl === "number") {
        setUser((prev) => (prev ? { ...prev, koreanLevel: lvl } : prev));
      }
    });

    /* 캐시 hydrate — 있으면 즉시 렌더 (재방문 flicker 제거) */
    const cached = readCachedStats(profile.userId);
    if (cached) setWeeklyStats(cached);

    /* 주간 통계 + 누적 대화 횟수 병렬 호출 — 둘 다 완료 후 한 번에 세팅해 0→실값 flicker 제거
       (누적대화횟수는 완료된 세션만 카운트, weekly-stats는 고아 세션까지 포함해서 불일치) */
    Promise.allSettled([
      getWeeklyStats(profile.userId),
      getUserSessions(profile.userId),
    ]).then(([statsRes, sessionsRes]) => {
      if (statsRes.status === "fulfilled") {
        setUser((prev) => prev ? {
          ...prev,
          grade: parseGrade(statsRes.value.latestGrade || ""),
        } : prev);
      }
      /* 실패한 필드는 캐시값 보존, 없으면 0 폴백 */
      const next: WeeklyStatsType = {
        averageScore: statsRes.status === "fulfilled" ? statsRes.value.averageScore : (cached?.averageScore ?? 0),
        streakDays: statsRes.status === "fulfilled" ? (statsRes.value.streakDays ?? 0) : (cached?.streakDays ?? 0),
        sessionsPerUserCount: sessionsRes.status === "fulfilled" ? sessionsRes.value.totalCount : (cached?.sessionsPerUserCount ?? 0),
      };
      setWeeklyStats(next);
      /* 두 호출 중 하나라도 성공했을 때만 캐시 갱신 */
      if (statsRes.status === "fulfilled" || sessionsRes.status === "fulfilled") {
        writeCachedStats(profile.userId, next);
      }
    });
  }, [router]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <HomeHeader />
      {user && (
        <div id="tutorial-tier-card">
          <TierCard user={user} />
        </div>
      )}
      <div id="tutorial-weekly-stats">
        <WeeklyStats stats={weeklyStats} />
      </div>

      {/* 주간 복습 배너 */}
      <Link href="/review" id="tutorial-review-banner">
        <div className="mx-5 rounded-2xl bg-card-bg border border-card-border p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
          <div>
            <p className="text-sm font-bold text-foreground">{t("home.weeklyReviewTitle")}</p>
            <p className="text-[12px] text-tab-inactive mt-1">
              {t("home.weeklyReviewContent")}
            </p>
          </div>
          <ChevronRight size={20} className="text-tab-inactive shrink-0" />
        </div>
      </Link>

      {/* 대화 시작 버튼 (단일) */}
      <div className="mx-5 mt-2" id="tutorial-cta">
        <button
          onClick={() => router.push("/location")}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[17px] active:scale-[0.97] transition-transform duration-100"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-btn-primary-text)",
          }}
        >
          <MessageCircle size={18} strokeWidth={2.5} />
          {t("home.newBtn")}
        </button>
      </div>

      {tutorial.isActive && tutorial.step && (
        <TutorialOverlay
          step={tutorial.step}
          currentStep={tutorial.currentStep}
          totalSteps={tutorial.totalSteps}
          onNext={tutorial.nextStep}
          onSkip={tutorial.skipTutorial}
          isLastStep={tutorial.currentStep === tutorial.totalSteps - 1}
        />
      )}
    </div>
  );
}
