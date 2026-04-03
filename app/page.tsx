"use client";

/* ──────────────────────────────────────────
   홈 페이지 (/)
   - HomeHeader: 앱 이름 + 프로필 아이콘
   - TierCard: 현재 티어 + XP 진행 바
   - WeeklyStats: 대화 수 / 평균 점수 / 스트릭
   - CTA 버튼: 대화 시작 → /location 이동

   ⚡ BE API 연동 전 mock data 사용 중
   🔗 연동 필요: GET /user/profile, GET /user/weekly-stats
   ────────────────────────────────────────── */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";
import HomeHeader from "@/components/HomeHeader";
import TierCard from "@/components/TierCard";
import WeeklyStats from "@/components/WeeklyStats";
import { UserProfile, WeeklyStats as WeeklyStatsType } from "@/types/user";
import { isSetupDone } from "@/hooks/useSetup";

/* ── Mock Data (BE API 완성 후 실제 데이터로 교체) ── */
const MOCK_USER: UserProfile = {
  userNickname: "learner_42",
  grade: "Silver",
  xp: 3200,
  xpMax: 5000,
  xpToNext: 1800,
};

const MOCK_WEEKLY_STATS: WeeklyStatsType = {
  conversationCount: 5,
  averageScore: 7.4,
  streakDays: 3,
};

export default function HomePage() {
  const router = useRouter();

  /* ── 최초 방문: 맞춤 학습 설정 미완료면 /setup으로 이동 ── */
  useEffect(() => {
    if (!isSetupDone()) {
      router.replace("/setup");
    }
  }, [router]);

  return (
    <>
      {/* pb-24: 하단 탭 바 높이만큼 여백 확보 */}
      <div className="flex flex-col gap-4 pb-24">
        <HomeHeader user={MOCK_USER} />
        {/* 티어 카드 — 준비 중 (블러 + 🚧) */}
        <div className="relative pointer-events-none select-none">
          <div className="blur-[3px]">
            <TierCard user={MOCK_USER} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🚧</span>
          </div>
        </div>
        <WeeklyStats stats={MOCK_WEEKLY_STATS} />

        {/* 재도전 카드 — 준비 중 (블러 + 🚧) */}
        <div className="mx-5 relative pointer-events-none select-none">
          <div className="blur-[3px] rounded-2xl bg-card-bg border border-card-border p-4">
            <p className="text-[13px] text-tab-inactive mb-2">
              지난 대화를 다시 도전해봐요!
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  한강 자전거길에서 길 찾기
                </p>
                <p className="text-[12px] text-tab-inactive mt-1">
                  지난주 최저점: <span className="font-bold" style={{ color: "var(--color-accent)" }}>4.2</span> / 10
                </p>
              </div>
              <div className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-bold shrink-0"
                style={{ backgroundColor: "var(--color-accent)", color: "var(--color-btn-primary-text)" }}>
                <RotateCcw size={14} strokeWidth={2.5} />
                재도전
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🚧</span>
          </div>
        </div>

        {/* 주간 복습 배너 — 준비 중 (블러 + 🚧) */}
        <div className="mx-5 relative pointer-events-none select-none">
          <div className="blur-[3px] rounded-2xl bg-card-bg border border-card-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">주간 복습 준비됐어요!</p>
              <p className="text-[12px] text-tab-inactive mt-1">
                초성퀴즈 <span className="font-bold" style={{ color: "var(--color-accent)" }}>3</span>개, 플래시카드 <span className="font-bold" style={{ color: "var(--color-accent)" }}>5</span>개
              </p>
            </div>
            <ChevronRight size={20} className="text-tab-inactive shrink-0" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🚧</span>
          </div>
        </div>

        {/* 대화 시작 CTA 버튼 (tutorial-cta id 부여) — 맨 하단 배치 */}
        <div className="mx-5 mt-2">
          <Link href="/location">
            <button
              className="
                w-full py-4 rounded-2xl
                bg-btn-primary text-btn-primary-text font-bold text-[15px]
                active:scale-[0.97] transition-transform duration-100
              "
            >
              대화 시작하기
            </button>
          </Link>
        </div>
      </div>

    </>
  );
}
