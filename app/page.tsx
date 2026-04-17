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
import { getReviewCount, getWeeklyStats, getUserSessions } from "@/lib/api";
import { getXpData, getXpBarInfo } from "@/lib/xpSystem";
import { mapKoreanLevel } from "@/lib/koreanLevel";

/* grade 문자열("초급 <B>")에서 Grade 타입으로 매핑 */
function parseGrade(raw: string): Grade {
  const m = raw.match(/<(\w+)>/);
  const code = m ? m[1] : raw;
  if (["S", "A", "B", "C"].includes(code)) return code as Grade;
  return "C";
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [quizCount, setQuizCount] = useState(0);
  const [flashCount, setFlashCount] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsType>({ sessionsPerUserCount: 0, averageScore: 0, streakDays: 0 });

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
      koreanLevel: mapKoreanLevel(profile.koreanLevel),
      level: bar.level,
      xp: bar.currentLevelXp,
      xpMax: bar.requiredLevelXp,
      xpToNext: bar.requiredLevelXp - bar.currentLevelXp,
    });

    /* API 병렬 호출 */
    getReviewCount(profile.userId)
      .then((res) => {
        setQuizCount(res.chosungQuizCount);
        setFlashCount(res.flashcardCount);
      })
      .catch(() => {});

    getWeeklyStats(profile.userId)
      .then((res) => {
        setUser((prev) => prev ? {
          ...prev,
          grade: parseGrade(res.latestGrade || ""),
        } : prev);
        setWeeklyStats((prev) => ({
          ...prev,
          averageScore: res.averageScore,
          streakDays: res.streakDays ?? 0,
        }));
      })
      .catch(() => {});

    // 누적대화횟수는 완료된 세션만 카운트 (weekly-stats는 고아 세션까지 포함해서 불일치)
    getUserSessions(profile.userId)
      .then((res) => {
        setWeeklyStats((prev) => ({ ...prev, sessionsPerUserCount: res.totalCount }));
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <HomeHeader />
      {user && <TierCard user={user} />}
      <WeeklyStats stats={weeklyStats} />

      {/* 주간 복습 배너 */}
      <Link href="/review">
        <div className="mx-5 rounded-2xl bg-card-bg border border-card-border p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
          <div>
            <p className="text-sm font-bold text-foreground">{t("home.weeklyReviewTitle")}</p>
            <p className="text-[12px] text-tab-inactive mt-1">
              {t("home.weeklyReviewContent", { quiz: quizCount, flash: flashCount })}
            </p>
          </div>
          <ChevronRight size={20} className="text-tab-inactive shrink-0" />
        </div>
      </Link>

      {/* 대화 시작 버튼 (단일) */}
      <div className="mx-5 mt-2">
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
    </div>
  );
}
