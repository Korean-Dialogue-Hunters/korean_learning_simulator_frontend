/* ──────────────────────────────────────────
   닉네임 생성 유틸 테스트 (TDD)
   ────────────────────────────────────────── */

import {
  getByteLength,
  MAX_NICKNAME_BYTES,
  generateRandomNickname,
  validateNickname,
} from "@/lib/nicknameGenerator";

describe("getByteLength", () => {
  it("ASCII 문자는 1바이트", () => {
    expect(getByteLength("abc")).toBe(3);
  });

  it("한글 문자는 3바이트", () => {
    expect(getByteLength("가")).toBe(3);
    expect(getByteLength("고양이")).toBe(9);
  });

  it("빈 문자열은 0바이트", () => {
    expect(getByteLength("")).toBe(0);
  });

  it("혼합 문자열 바이트 계산", () => {
    // "ab" = 2바이트 + "가" = 3바이트 = 5바이트
    expect(getByteLength("ab가")).toBe(5);
  });
});

describe("generateRandomNickname", () => {
  it("16바이트 이하의 닉네임을 생성한다", () => {
    for (let i = 0; i < 50; i++) {
      const nickname = generateRandomNickname();
      expect(getByteLength(nickname)).toBeLessThanOrEqual(MAX_NICKNAME_BYTES);
    }
  });

  it("빈 문자열을 반환하지 않는다", () => {
    for (let i = 0; i < 50; i++) {
      const nickname = generateRandomNickname();
      expect(nickname.length).toBeGreaterThan(0);
    }
  });

  it("한국어 문자가 포함된다", () => {
    const koreanRegex = /[가-힣]/;
    for (let i = 0; i < 20; i++) {
      const nickname = generateRandomNickname();
      expect(koreanRegex.test(nickname)).toBe(true);
    }
  });
});

describe("validateNickname", () => {
  it("유효한 닉네임은 valid: true", () => {
    expect(validateNickname("빛나는별")).toEqual({ valid: true });
  });

  it("빈 문자열은 invalid", () => {
    const result = validateNickname("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("공백만 있는 경우 invalid", () => {
    const result = validateNickname("   ");
    expect(result.valid).toBe(false);
  });

  it("32바이트 초과 시 invalid", () => {
    // 한글 11글자 = 33바이트 > 32
    const result = validateNickname("빛나는고양이와사자와호랑");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("32바이트");
  });

  it("정확히 32바이트는 valid", () => {
    // 한글 10글자 = 30바이트 + "ab" = 32바이트
    const nickname = "고양이바다하늘별달산ab";
    expect(getByteLength(nickname)).toBe(32);
    expect(validateNickname(nickname).valid).toBe(true);
  });

  it("ASCII 닉네임도 valid", () => {
    expect(validateNickname("user123").valid).toBe(true);
  });
});
