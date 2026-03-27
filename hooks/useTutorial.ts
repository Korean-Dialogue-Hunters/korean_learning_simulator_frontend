"use client";

/* ──────────────────────────────────────────
   useTutorial 커스텀 훅
   - 튜토리얼 완료 여부 로컬스토리지 저장/읽기/초기화
   - 3단계 스텝 관리 (한 스텝에 여러 타겟 동시 하이라이트)
   ────────────────────────────────────────── */

import { useState, useCallback } from "react";

// 로컬스토리지 키
export const TUTORIAL_DONE_KEY = "tutorialDone";

// 튜토리얼 완료 여부 확인
export function isTutorialDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TUTORIAL_DONE_KEY) === "true";
}

// 튜토리얼 완료 저장
export function setTutorialDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TUTORIAL_DONE_KEY, "true");
}

// 튜토리얼 완료 초기화 (프로필 페이지 "다시 보기" 버튼용)
export function resetTutorial(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TUTORIAL_DONE_KEY);
}

/* ── 타겟 하나의 데이터 타입 ── */
export interface TutorialTarget {
  targetId: string;                  // 하이라이트할 DOM 요소의 id
  message: string;                   // 말풍선 텍스트
  position: "top" | "bottom";       // 말풍선 위치 (타겟 위/아래)
}

/* ── 스텝 타입 (멀티 타겟) ── */
export interface TutorialStep {
  title: string;                     // 스텝 제목 (예: "내 정보 확인")
  targets: TutorialTarget[];         // 이 스텝에서 동시에 하이라이트할 요소 목록
}

/* ── 3단계 스텝 정의 ── */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "내 정보 확인",
    targets: [
      { targetId: "tutorial-profile",      message: "내 프로필이에요",               position: "bottom" },
      { targetId: "tutorial-tier-card",    message: "현재 레벨과 경험치를 확인하세요", position: "bottom" },
      { targetId: "tutorial-weekly-stats", message: "이번 주 학습 현황이에요",        position: "bottom" },
    ],
  },
  {
    title: "학습 시작",
    targets: [
      { targetId: "tutorial-cta",           message: "여기서 대화를 시작해요!",            position: "bottom" },
      { targetId: "tutorial-retry-card",    message: "아쉬웠던 대화를 다시 도전해봐요",    position: "bottom" },
      { targetId: "tutorial-review-banner", message: "퀴즈와 플래시 카드로 복습해요",      position: "bottom" },
    ],
  },
  {
    title: "화면 이동",
    targets: [
      { targetId: "tutorial-bottom-tab", message: "5개 탭으로 자유롭게 이동하세요", position: "top" },
    ],
  },
];

/* ── useTutorial 훅 ── */
export function useTutorial() {
  const [currentStep, setCurrentStep] = useState(0); // 현재 스텝 인덱스 (0부터 시작)
  const [isActive, setIsActive] = useState(false);   // 튜토리얼 진행 중 여부

  const totalSteps = TUTORIAL_STEPS.length; // 3

  // 튜토리얼 시작
  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  // 튜토리얼 완료 처리
  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setTutorialDone();
  }, []);

  // 다음 스텝으로 이동
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep, totalSteps, completeTutorial]);

  // 건너뛰기 (완료와 동일)
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
