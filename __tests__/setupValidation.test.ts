/* ──────────────────────────────────────────
   맞춤 학습 설정 유효성 검사 테스트 (TDD)
   - validateSetupProfile 함수의 모든 경우를 검증
   ────────────────────────────────────────── */

import { validateSetupProfile } from "@/lib/setupValidation";
import { SetupProfile } from "@/types/setup";

/* ── 유효한 프로필 데이터 (기본 테스트용) ── */
const VALID_PROFILE: SetupProfile = {
  nationality: "US",
  level: "초급",
  kulturalInterest: "K-Pop",
  preferredLocation: "hangang",
};

describe("validateSetupProfile", () => {
  /* ── 정상 케이스 ── */
  test("유효한 프로필이면 빈 배열 반환", () => {
    const errors = validateSetupProfile(VALID_PROFILE);
    expect(errors).toEqual([]);
  });

  /* ── nationality 검증 ── */
  test("nationality가 빈 문자열이면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, nationality: "" });
    expect(errors).toContain("nationality");
  });

  test("nationality가 공백만 있으면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, nationality: " " });
    expect(errors).toContain("nationality");
  });

  test("nationality가 1자이면 에러 반환", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, nationality: "A" });
    expect(errors).toContain("nationality");
  });

  test("nationality가 2자 이상이면 통과", () => {
    const errors = validateSetupProfile({ ...VALID_PROFILE, nationality: "KR" });
    expect(errors).not.toContain("nationality");
  });

  /* ── level 검증 ── */
  test("level이 유효하지 않은 값이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      level: "최고급" as SetupProfile["level"],
    });
    expect(errors).toContain("level");
  });

  test.each(["초급", "중급", "고급"] as const)(
    "level이 '%s'이면 통과",
    (level) => {
      const errors = validateSetupProfile({ ...VALID_PROFILE, level });
      expect(errors).not.toContain("level");
    }
  );

  /* ── kulturalInterest 검증 ── */
  test("kulturalInterest가 유효하지 않은 값이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      kulturalInterest: "K-Unknown" as SetupProfile["kulturalInterest"],
    });
    expect(errors).toContain("kulturalInterest");
  });

  test.each([
    "K-Content",
    "K-Pop",
    "K-Beauty",
    "K-Food",
    "K-Gaming·eSports",
    "Others",
  ] as const)(
    "kulturalInterest가 '%s'이면 통과",
    (interest) => {
      const errors = validateSetupProfile({
        ...VALID_PROFILE,
        kulturalInterest: interest,
      });
      expect(errors).not.toContain("kulturalInterest");
    }
  );

  /* ── preferredLocation 검증 ── */
  test("preferredLocation이 존재하지 않는 장소이면 에러 반환", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      preferredLocation: "unknown-place" as SetupProfile["preferredLocation"],
    });
    expect(errors).toContain("preferredLocation");
  });

  test("preferredLocation이 'hangang'이면 통과", () => {
    const errors = validateSetupProfile({
      ...VALID_PROFILE,
      preferredLocation: "hangang",
    });
    expect(errors).not.toContain("preferredLocation");
  });

  /* ── 다중 에러 ── */
  test("여러 필드가 동시에 잘못되면 모두 에러 반환", () => {
    const errors = validateSetupProfile({
      nationality: "",
      level: "없음" as SetupProfile["level"],
      kulturalInterest: "없음" as SetupProfile["kulturalInterest"],
      preferredLocation: "없음" as SetupProfile["preferredLocation"],
    });
    expect(errors).toHaveLength(4);
    expect(errors).toContain("nationality");
    expect(errors).toContain("level");
    expect(errors).toContain("kulturalInterest");
    expect(errors).toContain("preferredLocation");
  });
});
