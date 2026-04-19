"use client";

/* ──────────────────────────────────────────
   useTutorial — 홈 첫 접속 스포트라이트 튜토리얼
   - 완료 여부: localStorage (설정의 "다시 보기"로 초기화 가능)
   - 스텝 3개 (내 정보 / 학습 시작 / 화면 이동)
   - 각 스텝은 여러 타겟을 동시 하이라이트
   ────────────────────────────────────────── */

import { useCallback, useState } from "react";

export const TUTORIAL_DONE_KEY = "tutorialDone";

export function isTutorialDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TUTORIAL_DONE_KEY) === "true";
}

export function setTutorialDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TUTORIAL_DONE_KEY, "true");
}

export function resetTutorial(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TUTORIAL_DONE_KEY);
}

/* 타겟 = 하이라이트할 DOM element id + i18n 메시지 키 */
export interface TutorialTarget {
  targetId: string;
  messageKey: string;
}

/* 스텝 = 제목(i18n 키) + 타겟 목록 */
export interface TutorialStep {
  titleKey: string;
  targets: TutorialTarget[];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    titleKey: "tutorial.step1Title",
    targets: [
      { targetId: "tutorial-tier-card",    messageKey: "tutorial.tierCard" },
      { targetId: "tutorial-weekly-stats", messageKey: "tutorial.weeklyStats" },
    ],
  },
  {
    titleKey: "tutorial.step2Title",
    targets: [
      { targetId: "tutorial-review-banner", messageKey: "tutorial.reviewBanner" },
      { targetId: "tutorial-cta",           messageKey: "tutorial.cta" },
    ],
  },
  {
    titleKey: "tutorial.step3Title",
    targets: [
      { targetId: "tutorial-tab-home",    messageKey: "tutorial.tabHome" },
      { targetId: "tutorial-tab-history", messageKey: "tutorial.tabHistory" },
      { targetId: "tutorial-tab-review",  messageKey: "tutorial.tabReview" },
      { targetId: "tutorial-tab-levelup", messageKey: "tutorial.tabLevelUp" },
    ],
  },
];

export function useTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const totalSteps = TUTORIAL_STEPS.length;

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setTutorialDone();
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < totalSteps - 1) return prev + 1;
      setIsActive(false);
      setTutorialDone();
      return prev;
    });
  }, [totalSteps]);

  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  return {
    isActive,
    currentStep,
    totalSteps,
    step: TUTORIAL_STEPS[currentStep],
    startTutorial,
    nextStep,
    skipTutorial,
    completeTutorial,
  };
}
