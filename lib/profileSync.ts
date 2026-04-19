/* ──────────────────────────────────────────
   korean_level 동기화 유틸
   - SetupProfile.koreanLevel은 셋업 시점 문자열(초급/중급/고급)로 고정.
   - 시험 통과 / 자동 강등 이후 BE가 korean_level(1~6 정수)을 갱신하면
     이 값을 localStorage에 캐싱해 TierCard/승급 탭이 즉시 최신값을 반영.
   ────────────────────────────────────────── */

import { getSavedProfile } from "@/hooks/useSetup";
import { mapKoreanLevel } from "@/lib/koreanLevel";
import { getUserProfile } from "@/lib/api";

const OVERRIDE_KEY = "currentKoreanLevel";

/* 현재 사용자에게 보여줄 korean_level 정수값.
   BE 최신값(override)이 있으면 그 값, 없으면 셋업 프로필에서 매핑. */
export function getEffectiveKoreanLevel(): number {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 6) return parsed;
    }
  }
  const profile = getSavedProfile();
  return profile ? mapKoreanLevel(profile.koreanLevel) : 1;
}

export function setKoreanLevelOverride(level: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(1, Math.min(6, Math.round(level)));
  localStorage.setItem(OVERRIDE_KEY, String(clamped));
}

export function clearKoreanLevelOverride(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OVERRIDE_KEY);
}

/* BE에서 최신 profile을 받아 korean_level을 localStorage에 캐시.
   반환: 성공 시 레벨, 실패 시 null (호출부는 silent fallback). */
export async function refreshProfileFromBE(userId: string): Promise<number | null> {
  try {
    const res = await getUserProfile(userId);
    if (typeof res.koreanLevel === "number") {
      setKoreanLevelOverride(res.koreanLevel);
      return res.koreanLevel;
    }
  } catch {
    /* 네트워크/BE 에러 — 폴백은 setup profile */
  }
  return null;
}
