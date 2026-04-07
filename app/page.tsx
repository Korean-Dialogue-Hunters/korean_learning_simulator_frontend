"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronRight, RotateCcw } from "lucide-react";
import HomeHeader from "@/components/HomeHeader";
import TierCard from "@/components/TierCard";
import WeeklyStats from "@/components/WeeklyStats";
import { UserProfile, WeeklyStats as WeeklyStatsType, Grade } from "@/types/user";
import { isSetupDone, getSavedProfile } from "@/hooks/useSetup";
import { getReviewCount, getWeeklyStats } from "@/lib/api";

/* grade 문자열("Beginner <B>")에서 Grade 타입으로 매핑 */
function parseGrade(raw: string): Grade {
  const map: Record<string, Grade> = { B: "Bronze", S: "Silver", G: "Gold", P: "Platinum", D: "Diamond" };
  const m = raw.match(/<(\w)>/);
  return (m && map[m[1]]) ?? "Bronze";
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [quizCount, setQuizCount] = useState(0);
  const [flashCount, setFlashCount] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsType>({ conversationCount: 0, averageScore: 0, streakDays: 0 });

  useEffect(() => {
    if (!isSetupDone()) {
      router.replace("/setup");
      return;
    }
    const profile = getSavedProfile();
    if (!profile) return;

    /* 프로필 기본값 세팅 (닉네임은 로컬, xp/grade는 API 대기) */
    setUser({
      userNickname: profile.userNickname,
      grade: "Bronze",
      xp: 0, xpMax: 1000, xpToNext: 1000,
    });

    /* API 병렬 호출 */
    getReviewCount(profile.userNickname)
      .then((res) => {
        setQuizCount(res.chosungQuizCount);
        setFlashCount(res.flashcardCount);
      })
      .catch(() => {});

    getWeeklyStats(profile.userNickname)
      .then((res) => {
        setUser((prev) => prev ? {
          ...prev,
          grade: parseGrade(res.latestGrade || ""),
        } : prev);
        setWeeklyStats({
          conversationCount: res.conversationCount,
          averageScore: res.averageScore,
          streakDays: 0, // BE 미제공 — 추후 별도 로직
        });
      })
      .catch(() => {});
  }, [router]);

  return (
    <>
      <div className="flex flex-col gap-4 pb-24">
        <HomeHeader />
        {user && <TierCard user={user} />}
        <WeeklyStats stats={weeklyStats} />

        {/* 재도전 카드 */}
        <div className="mx-5 rounded-2xl bg-card-bg border border-card-border p-4">
          <p className="text-[13px] text-tab-inactive mb-2">{t("home.retryTitle")}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{t("home.retrySubTitle")}</p>
              <p className="text-[12px] text-tab-inactive mt-1">
                {t("home.retryScoreLabel")}{" "}
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>4.2</span> / 10
              </p>
            </div>
            <div className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-bold shrink-0"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
              <RotateCcw size={14} strokeWidth={2.5} />
              {t("home.retryBtn")}
            </div>
          </div>
        </div>

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

        {/* 대화 시작 CTA */}
        <div className="mx-5 mt-2">
          <Link href="/location">
            <button className="w-full py-4 rounded-2xl bg-btn-primary text-btn-primary-text font-bold text-[15px] active:scale-[0.97] transition-transform duration-100">
              {t("home.startBtn")}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
