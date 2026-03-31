"use client";

/* ──────────────────────────────────────────
   홈 페이지 (/)
   - HomeHeader: 앱 이름 + 프로필 아이콘
   - TierCard: 현재 티어 + XP 진행 바
   - WeeklyStats: 대화 수 / 평균 점수 / 스트릭
   - CTA 버튼: 대화 시작 → /location 이동
   - TutorialOverlay: 맞춤 학습 설정 NO 선택 후 최초 1회 실행

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
import TutorialOverlay from "@/components/tutorial/TutorialOverlay";
import { UserProfile, WeeklyStats as WeeklyStatsType } from "@/types/user";
import { useTutorial, isTutorialDone } from "@/hooks/useTutorial";
import { isSetupDone } from "@/hooks/useSetup";

/* ── Mock Data (BE API 완성 후 실제 데이터로 교체) ── */
const MOCK_USER: UserProfile = {
  userId: "learner_42",
  tier: "Silver",
  xp: 3200,
  xpMax: 5000,
  xpToNextTier: 1800,
};

const MOCK_WEEKLY_STATS: WeeklyStatsType = {
  conversationCount: 5,
  averageScore: 7.4,
  streakDays: 3,
};

export default function HomePage() {
  const router = useRouter();
  const { isActive, currentStep, totalSteps, step, startTutorial, nextStep, skipTutorial } =
    useTutorial();

  /* ── 최초 방문: 맞춤 학습 설정 미완료면 /setup으로 이동 ── */
  useEffect(() => {
    if (!isSetupDone()) {
      router.replace("/setup");
      return;
    }
    // 설정 완료 + 튜토리얼 미완료 → 튜토리얼 자동 시작
    if (!isTutorialDone()) {
      // 컴포넌트가 완전히 마운트된 후 시작 (DOM 위치 측정을 위해 약간 지연)
      const timer = setTimeout(() => startTutorial(), 300);
      return () => clearTimeout(timer);
    }
  }, [router, startTutorial]);

  /* ── 튜토리얼 마지막 스텝 완료 → /location 이동 ── */
  const handleTutorialNext = () => {
    if (currentStep === totalSteps - 1) {
      nextStep(); // completeTutorial 호출됨
      router.push("/location");
    } else {
      nextStep();
    }
  };

  return (
    <>
      {/* pb-24: 하단 탭 바 높이만큼 여백 확보 */}
      <div className="flex flex-col gap-4 pb-24">
        {/* 헤더: 앱 이름 + 프로필 (tutorial-profile id 부여) */}
        <div id="tutorial-profile">
          <HomeHeader user={MOCK_USER} />
        </div>

        {/* 티어 카드 (tutorial-tier-card id 부여) */}
        <div id="tutorial-tier-card">
          <TierCard user={MOCK_USER} />
        </div>

        {/* 주간 통계 (tutorial-weekly-stats + tutorial-streak id 부여) */}
        <div id="tutorial-weekly-stats">
          <WeeklyStats stats={MOCK_WEEKLY_STATS} />
        </div>

        {/* 재도전 카드 — 지난 대화 중 최저점 시나리오 재도전 */}
        <div id="tutorial-retry-card" className="mx-5">
          <div className="rounded-2xl bg-card-bg border border-card-border p-4">
            {/* 제목 */}
            <p className="text-[13px] text-tab-inactive mb-2">
              지난 대화를 다시 도전해봐요!
            </p>

            {/* 미션 + 점수 + 재도전 버튼 */}
            <div className="flex items-center gap-3">
              {/* 좌측: 미션·점수 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  한강 자전거길에서 길 찾기
                </p>
                <p className="text-[12px] text-tab-inactive mt-1">
                  지난주 최저점: <span className="font-bold" style={{ color: "var(--color-accent)" }}>4.2</span> / 10
                </p>
              </div>

              {/* 우측: 재도전 버튼 */}
              <button
                type="button"
                onClick={() => router.push("/location")}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 shrink-0"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-btn-primary-text)",
                }}
              >
                <RotateCcw size={14} strokeWidth={2.5} />
                재도전
              </button>
            </div>
          </div>
        </div>

        {/* 주간 복습 배너 — 초성 퀴즈 + 플래시 카드 개수 표시, /review로 유도 */}
        <div id="tutorial-review-banner" className="mx-5">
          <Link href="/review">
            <div className="rounded-2xl bg-card-bg border border-card-border p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
              <div>
                <p className="text-sm font-bold text-foreground">주간 복습 준비됐어요!</p>
                <p className="text-[12px] text-tab-inactive mt-1">
                  초성퀴즈 <span className="font-bold" style={{ color: "var(--color-accent)" }}>3</span>개, 플래시카드 <span className="font-bold" style={{ color: "var(--color-accent)" }}>5</span>개
                </p>
              </div>
              <ChevronRight size={20} className="text-tab-inactive shrink-0" />
            </div>
          </Link>
        </div>

        {/* 대화 시작 CTA 버튼 (tutorial-cta id 부여) — 맨 하단 배치 */}
        <div className="mx-5 mt-2" id="tutorial-cta">
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

      {/* 하단 탭 바 영역 id (tutorial-bottom-tab) — layout의 BottomTabBar를 감싸는 용도 */}
      {/* BottomTabBar는 layout.tsx에서 렌더링되므로, 홈에서는 감지용 마커 div만 배치 */}
      <div id="tutorial-bottom-tab" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 pointer-events-none z-30" />

      {/* 튜토리얼 오버레이 (활성 상태일 때만 렌더링) */}
      {isActive && step && (
        <TutorialOverlay
          step={step}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleTutorialNext}
          onSkip={skipTutorial}
          isLastStep={currentStep === totalSteps - 1}
        />
      )}
    </>
  );
}
