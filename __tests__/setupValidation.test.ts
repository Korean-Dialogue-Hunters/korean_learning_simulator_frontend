/* ──────────────────────────────────────────
   맞춤 학습 설정 유효성 검사 테스트 (TDD)
   - validateSetupProfile 함수의 모든 경우를 검증
   ────────────────────────────────────────── */

import { validateSetupProfile } from "@/lib/setupValidation";
import { SetupProfile } from "@/types/setup";

/* ── 유효한 프로필 데이터 (기본 테스트용) ── */
const VALID_PROFILE: SetupProfile = {
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  country: "US",
  user_nickname: "빛나는별",
  korean_level: "초급",
  cultural_interest: "K-Pop",
  location: "hangang",
};

describe("validateSetupProfile", () => {
  /* ── 정상 케이스 ── */
  test("유효한 프로필이면 빈 배열 반환", () => {
    const errors = validateSetupProfile(VALID_PROFILE);
    expect(errors).toEqual([]);
  });

  /* ── country 검증 ── */
  test("country가 빈 문자열이면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, country: "" });
    expect(errors).toContain("country");
  });

  test("country가 공백만 있으면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, country: " " });
    expect(errors).toContain("country");
  });

  test("country가 1자이면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, country: "A" });
    expect(errors).toContain("country");
  });

  test("country가 2자 이상이면 통과", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, country: "KR" });
    expect(errors).not.toContain("country");
  });

  /* ── korean_level 검증 ── */
  test("korean_level이 유효하지 않은 값이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      korean_level: "최고급" as SetupProfile["korean_level"],
    });
    expect(errors).toContain("korean_level");
  });

  test.each(["초급", "중급", "고급"] as const)(
    "korean_level이 '%s'이면 통과",
    (korean_level) => {
      const errors = validateSetupProfile({ ...VALID_PROFILE, korean_level });
      expect(errors).not.toContain("korean_level");
    }
  );

  /* ── cultural_interest 검증 ── */
  test("cultural_interest가 유효하지 않은 값이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      cultural_interest: "K-Unknown" as SetupProfile["cultural_interest"],
    });
    expect(errors).toContain("cultural_interest");
  });

  test.each([
    "K-Content",
    "K-Pop",
    "K-Beauty",
    "K-Food",
    "K-Gaming·eSports",
    "Others",
  ] as const)(
    "cultural_interest가 '%s'이면 통과",
    (interest) => {
      const errors = validateSetupProfile({
        ...VALID_PROFILE,
        cultural_interest: interest,
      });
      expect(errors).not.toContain("cultural_interest");
    }
  );

  /* ── location 검증 ── */
  test("location이 존재하지 않는 장소이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      location: "unknown-place" as SetupProfile["location"],
    });
    expect(errors).toContain("location");
  });

  test("location이 'hangang'이면 통과", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      location: "hangang",
    });
    expect(errors).not.toContain("location");
  });

  /* ── user_nickname 검증 ── */
  test("user_nickname이 빈 문자열이면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, user_nickname: "" });
    expect(errors).toContain("user_nickname");
  });

  test("user_nickname이 32바이트 초과면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, user_nickname: "빛나는고양이와사자와호랑" });
    expect(errors).toContain("user_nickname");
  });

  test("user_nickname이 유효하면 통과", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, user_nickname: "빛나는별" });
    expect(errors).not.toContain("user_nickname");
  });

  /* ── 다중 에러 ── */
  test("여러 필드가 동시에 잘못되면 모두 에러 반환", () => {
    const errors = validateSetupProfile({
      user_id: "some-uuid",
      country: "",
      user_nickname: "",
      korean_level: "없음" as SetupProfile["korean_level"],
      cultural_interest: "없음" as SetupProfile["cultural_interest"],
      location: "없음" as SetupProfile["location"],
    });
    expect(errors).toHaveLength(5);
    expect(errors).toContain("country");
    expect(errors).toContain("user_nickname");
    expect(errors).toContain("korean_level");
    expect(errors).toContain("cultural_interest");
    expect(errors).toContain("location");
  });
});
