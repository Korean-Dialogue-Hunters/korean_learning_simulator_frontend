"use client";

/* ──────────────────────────────────────────
   useExamEligibility — 승급 시험 응시 가능 여부 훅
   - BottomTabBar/TierCard가 공유해서 ! 배지 및 강조 효과를 띄우는 데 사용
   - 첫 페인트는 localStorage 캐시 값 기준 → BE 응답 후 갱신
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { getLevelUpEligibility } from "@/lib/api";
import { getSavedProfile } from "./useSetup";

const CACHE_KEY = "examEligibleCache";

function readCache(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CACHE_KEY) === "true";
}

function writeCache(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, value ? "true" : "false");
}

export function clearExamEligibilityCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

export function useExamEligibility(): boolean {
  const [eligible, setEligible] = useState<boolean>(readCache);

  useEffect(() => {
    const profile = getSavedProfile();
    if (!profile) return;
    getLevelUpEligibility(profile.userId)
      .then((res) => {
        const val = !!res.eligible;
        setEligible(val);
        writeCache(val);
      })
      .catch(() => {});
  }, []);

  return eligible;
}
