"use client";

/* ──────────────────────────────────────────
   useSetup 커스텀 훅
   - 맞춤 학습 설정 상태(단계, 입력값) 관리
   - 완료 시 로컬스토리지에 프로필 저장
   - 2회차 접속 감지 (setupDone 플래그)
   ────────────────────────────────────────── */

import { useState } from "react";
import { SetupProfile, SetupStep } from "@/types/setup";
import { KoreanLevel, LocationId } from "@/types/setup";
import { validateSetupProfile } from "@/lib/setupValidation";
import { validateNickname } from "@/lib/nicknameGenerator";

// 로컬스토리지 키 상수
export const SETUP_DONE_KEY = "setupDone";
export const SETUP_PROFILE_KEY = "setupProfile";
export const USER_ID_KEY = "userId";

// 맞춤 학습 설정 완료 여부 확인 (userId가 있으면 완료)
export function isSetupDone(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(USER_ID_KEY);
}

// 저장된 userId(UUID) 가져오기
export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

// 저장된 프로필 불러오기
export function getSavedProfile(): SetupProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SETUP_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SetupProfile;
  } catch {
    return null;
  }
}

export function useSetup() {
  // 현재 단계 (1: 초기설정[언어/테마], 2: 국적, 3: 닉네임, 4: 관심문화, 5: 한국어 수준)
  const [step, setStep] = useState<SetupStep>(1);

  // 각 단계 입력값
  const [country, setCountry] = useState("US");
  const [userNickname, setUserNickname] = useState("");
  const [koreanLevel, setKoreanLevel] = useState<KoreanLevel | "">("초급");
  const [culturalInterest, setCulturalInterest] = useState<string[]>(["K-Content"]);
  const [location, setLocation] = useState<LocationId | "">("한강");

  // 즉시 시작 팝업 표시 여부
  const [showModal, setShowModal] = useState(false);

  // 현재 단계에서 다음으로 넘어갈 수 있는지 확인
  const canProceed = (): boolean => {
    if (step === 1) return true; // 초기설정은 토글이라 항상 진행 가능
    if (step === 2) return country.trim() !== "";
    if (step === 3) return validateNickname(userNickname).valid;
    if (step === 4) return culturalInterest.length > 0;
    if (step === 5) return koreanLevel !== "";
    return false;
  };

  // 다음 단계로 이동
  const goNext = () => {
    if (step < 5) {
      setStep((prev) => (prev + 1) as SetupStep);
    } else {
      // 마지막 단계 완료 → 팝업 표시
      setShowModal(true);
    }
  };

  // 이전 단계로 이동
  const goPrev = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as SetupStep);
    }
  };

  // 맞춤 학습 설정 완료 후 로컬스토리지에 저장
  const saveProfile = () => {
    // 타입 안전성: 모든 값이 채워져 있는지 검증
    if (!country || !userNickname || !koreanLevel || culturalInterest.length === 0 || !location) return;

    // UUID 생성 (기존 userId가 있으면 재사용)
    const existingId = localStorage.getItem(USER_ID_KEY);
    const userId = existingId || crypto.randomUUID();

    const profile: SetupProfile = {
      userId,
      country,
      userNickname: userNickname.trim(),
      koreanLevel,
      culturalInterest,
      location,
    };

    // 유효성 검사 (validateSetupProfile 함수 사용)
    const errors = validateSetupProfile(profile);
    if (errors.length > 0) return;

    // 로컬스토리지에 저장
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(SETUP_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(SETUP_DONE_KEY, "true");
  };

  return {
    step,
    country, setCountry,
    userNickname, setUserNickname,
    koreanLevel, setKoreanLevel,
    culturalInterest, setCulturalInterest,
    location, setLocation,
    showModal, setShowModal,
    canProceed,
    goNext,
    goPrev,
    saveProfile,
  };
}
