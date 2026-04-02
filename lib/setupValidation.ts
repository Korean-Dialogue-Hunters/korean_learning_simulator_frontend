/* ──────────────────────────────────────────
   맞춤 학습 설정 유효성 검사 함수 (TDD)
   - 테스트가 먼저 작성되었고, 테스트를 통과하도록 구현
   - 반환값: 에러가 있는 필드명 배열 (없으면 빈 배열)
   ────────────────────────────────────────── */

import { SetupProfile, LOCATION_OPTIONS } from "@/types/setup";
import { validateNickname } from "@/lib/nicknameGenerator";

// 유효한 수준 목록
const VALID_LEVELS = ["초급", "중급", "고급"] as const;

// 유효한 문화 관심사 목록
const VALID_INTERESTS = [
  "K-Content",
  "K-Pop",
  "K-Beauty",
  "K-Food",
  "K-Gaming·eSports",
  "Others",
] as const;

// 유효한 장소 ID 목록 (LOCATION_OPTIONS 배열에서 추출)
const VALID_LOCATION_IDS = LOCATION_OPTIONS.map((l) => l.id);

/**
 * SetupProfile의 유효성을 검사합니다.
 * @returns 에러가 있는 필드명 배열. 유효하면 빈 배열 반환.
 */
export function validateSetupProfile(
  profile: SetupProfile
): string[] {
  const errors: string[] = [];

  // nationality: 비어있거나 2자 미만이면 에러
  if (!profile.country || profile.country.trim().length < 2) {
    errors.push("country");
  }

  // user_nickname: 닉네임 유효성 검사
  if (!profile.user_nickname || !validateNickname(profile.user_nickname).valid) {
    errors.push("user_nickname");
  }

  // level: 허용된 값(초급/중급/고급) 중 하나여야 함
  if (!(VALID_LEVELS as readonly string[]).includes(profile.korean_level)) {
    errors.push("korean_level");
  }

  // cultural_interest: 허용된 값 중 하나여야 함
  if (!(VALID_INTERESTS as readonly string[]).includes(profile.cultural_interest)) {
    errors.push("cultural_interest");
  }

  // location: LOCATION_OPTIONS에 존재하는 ID여야 함
  if (!(VALID_LOCATION_IDS as readonly string[]).includes(profile.location)) {
    errors.push("location");
  }

  return errors;
}
