/* ──────────────────────────────────────────
   디자인 시스템 헬퍼 함수 테스트 (TDD)
   - warmCardStyle, warmIconContainerStyle, warmCtaStyle 검증
   ────────────────────────────────────────── */

import {
  warmCardStyle,
  warmIconContainerStyle,
  warmCtaStyle,
  WARM_THEME,
} from "@/lib/designSystem";

describe("warmCardStyle", () => {
  test("선택 상태면 액센트 배경 + 액센트 보더 반환", () => {
    const style = warmCardStyle(true);
    expect(style.backgroundColor).toBe(WARM_THEME.accentLight);
    expect(style.border).toContain(WARM_THEME.accent);
    expect(style.boxShadow).toContain(WARM_THEME.accentLight);
  });

  test("미선택 상태면 카드 배경 + 기본 보더 반환", () => {
    const style = warmCardStyle(false);
    expect(style.backgroundColor).toBe(WARM_THEME.card);
    expect(style.border).toContain(WARM_THEME.cardBorder);
    expect(style.boxShadow).toContain("rgba(0,0,0,0.04)");
  });
});

describe("warmIconContainerStyle", () => {
  test("선택 상태면 액센트 배경 + 흰색 아이콘", () => {
    const style = warmIconContainerStyle(true);
    expect(style.backgroundColor).toBe(WARM_THEME.accent);
    expect(style.color).toBe("#FFFFFF");
  });

  test("미선택 상태면 연한 배경 + 액센트 색상 아이콘", () => {
    const style = warmIconContainerStyle(false);
    expect(style.backgroundColor).toBe(WARM_THEME.accentLight);
    expect(style.color).toBe(WARM_THEME.accent);
  });
});

describe("warmCtaStyle", () => {
  test("활성 상태면 액센트 배경 + 흰색 텍스트 + pointer", () => {
    const style = warmCtaStyle(true);
    expect(style.backgroundColor).toBe(WARM_THEME.accent);
    expect(style.color).toBe("#FFFFFF");
    expect(style.cursor).toBe("pointer");
  });

  test("비활성 상태면 비활성 배경 + 보조 텍스트 + not-allowed", () => {
    const style = warmCtaStyle(false);
    expect(style.backgroundColor).toBe(WARM_THEME.dotInactive);
    expect(style.color).toBe(WARM_THEME.textSub);
    expect(style.cursor).toBe("not-allowed");
  });
});
