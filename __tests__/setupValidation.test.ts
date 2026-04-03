/* ──────────────────────────────────────────
   맞춤 학습 설정 유효성 검사 테스트 (TDD)
   - validateSetupProfile 함수의 모든 경우를 검증
   ────────────────────────────────────────── */

import { validateSetupProfile } from "@/lib/setupValidation";
import { SetupProfile } from "@/types/setup";

/* ── 유효한 프로필 데이터 (기본 테스트용) ── */
const VALID_PROFILE: SetupProfile = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  country: "US",
  userNickname: "빛나는별",
  koreanLevel: "초급",
  culturalInterest: "K-Pop",
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

  /* ── koreanLevel 검증 ── */
  test("koreanLevel이 유효하지 않은 값이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      koreanLevel: "최고급" as SetupProfile["koreanLevel"],
    });
    expect(errors).toContain("koreanLevel");
  });

  test.each(["초급", "중급", "고급"] as const)(
    "koreanLevel이 '%s'이면 통과",
    (koreanLevel) => {
      const errors = validateSetupProfile({ ...VALID_PROFILE, koreanLevel });
      expect(errors).not.toContain("koreanLevel");
    }
  );

  /* ── culturalInterest 검증 ── */
  test("culturalInterest가 유효하지 않은 값이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      culturalInterest: "K-Unknown" as SetupProfile["culturalInterest"],
    });
    expect(errors).toContain("culturalInterest");
  });

  test.each([
    "K-Content",
    "K-Pop",
    "K-Beauty",
    "K-Food",
    "K-Gaming·eSports",
    "Others",
  ] as const)(
    "culturalInterest가 '%s'이면 통과",
    (interest) => {
      const errors = validateSetupProfile({
        ...VALID_PROFILE,
        culturalInterest: interest,
      });
      expect(errors).not.toContain("culturalInterest");
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

  /* ── userNickname 검증 ── */
  test("userNickname이 빈 문자열이면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, userNickname: "" });
    expect(errors).toContain("userNickname");
  });

  test("userNickname이 32바이트 초과면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, userNickname: "빛나는고양이와사자와호랑" });
    expect(errors).toContain("userNickname");
  });

  test("userNickname이 유효하면 통과", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, userNickname: "빛나는별" });
    expect(errors).not.toContain("userNickname");
  });

  /* ── 다중 에러 ── */
  test("여러 필드가 동시에 잘못되면 모두 에러 반환", () => {
    const errors = validateSetupProfile({
      userId: "some-uuid",
      country: "",
      userNickname: "",
      koreanLevel: "없음" as SetupProfile["koreanLevel"],
      culturalInterest: "없음" as SetupProfile["culturalInterest"],
      location: "없음" as SetupProfile["location"],
    });
    expect(errors).toHaveLength(5);
    expect(errors).toContain("country");
    expect(errors).toContain("userNickname");
    expect(errors).toContain("koreanLevel");
    expect(errors).toContain("culturalInterest");
    expect(errors).toContain("location");
  });
});
