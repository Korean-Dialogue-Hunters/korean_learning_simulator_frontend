"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronRight, RotateCcw, Plus, Play, X } from "lucide-react";
import HomeHeader from "@/components/HomeHeader";
import TierCard from "@/components/TierCard";
import WeeklyStats from "@/components/WeeklyStats";
import { UserProfile, WeeklyStats as WeeklyStatsType, Grade } from "@/types/user";
import { isSetupDone, getSavedProfile, getUserId } from "@/hooks/useSetup";
import { getReviewCount, getWeeklyStats } from "@/lib/api";
import { getXpData, getXpBarInfo } from "@/lib/xpSystem";
import { getHistory } from "@/lib/historyStorage";

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
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsType>({ conversationCount: 0, averageScore: 0, streakDays: 0 });
  const [showNoSessionModal, setShowNoSessionModal] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  /* 세션 유무 감지 (팝업 닫힐 때도 재확인) */
  useEffect(() => {
    setHasActiveSession(!!localStorage.getItem("sessionId"));
  }, [showNoSessionModal]);

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
      level: bar.level,
      xp: bar.currentLevelXp,
      xpMax: bar.requiredLevelXp,
      xpToNext: bar.requiredLevelXp - bar.currentLevelXp,
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
          streakDays: res.streakDays ?? 0,
        });
      })
      .catch(() => {
        /* BE 실패 시 localStorage historyStorage에서 fallback */
        const history = getHistory();
        if (history.length > 0) {
          const avg = history.reduce((sum, r) => sum + r.totalScore10, 0) / history.length;
          setWeeklyStats({
            conversationCount: history.length,
            averageScore: Math.round(avg * 10) / 10,
            streakDays: 0,
          });
        }
      });
  }, [router]);

  return (
    <>
      {/* 진행 중 세션 없을 때 팝업 */}
      {showNoSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNoSessionModal(false)} />
          <div
            className="relative w-full max-w-[320px] rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}
          >
            <button
              type="button"
              onClick={() => setShowNoSessionModal(false)}
              className="absolute top-3 right-3 text-tab-inactive hover:opacity-70"
            >
              <X size={18} />
            </button>
            <p className="text-base font-bold text-foreground mb-2">
              {t("home.noSessionTitle")}
            </p>
            <p className="text-sm text-tab-inactive mb-6">
              {t("home.noSessionDesc")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNoSessionModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-foreground)" }}
              >
                {t("home.noSessionNo")}
              </button>
              <button
                type="button"
                onClick={() => { setShowNoSessionModal(false); router.push("/location"); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}
              >
                {t("home.noSessionYes")}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* 대화 버튼 2개: 새로 하기 (filled) + 이어 하기 (세션 유무에 따라 변화) */}
        <div className="mx-5 mt-2 flex gap-3">
          <button
            onClick={() => router.push("/location")}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] active:scale-[0.97] transition-transform duration-100"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            {t("home.newBtn")}
          </button>
          <button
            onClick={() => {
              if (!hasActiveSession) {
                setShowNoSessionModal(true);
                return;
              }
              /* 떠났던 단계로 복원: 페르소나 미선택이면 /persona, 아니면 /chat */
              const hasPersona = !!localStorage.getItem("myPersona");
              router.push(hasPersona ? "/chat" : "/persona");
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] active:scale-[0.97] transition-all duration-100 border-2"
            style={hasActiveSession ? {
              backgroundColor: "var(--color-accent)",
              borderColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            } : {
              backgroundColor: "transparent",
              borderColor: "var(--color-card-border)",
              color: "var(--color-tab-inactive)",
            }}
          >
            <Play size={18} strokeWidth={2.5} />
            {t("home.continueBtn")}
          </button>
        </div>
      </div>
    </>
  );
}
