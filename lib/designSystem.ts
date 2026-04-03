/* ──────────────────────────────────────────
   디자인 시스템 — 공통 스타일 토큰 & 유틸
   - 따뜻한 무드(setup)와 기본 앱 테마를 모두 관리
   - 새 화면 디자인 시 이 파일을 참고하여 일관된 스타일 적용
   - CSS 변수(globals.css)와 1:1 매핑
   ────────────────────────────────────────── */

/* ── 1. 따뜻한 무드 컬러 토큰 (맞춤 학습 설정, 웰컴 등) ── */
export const WARM_THEME = {
  /* 배경 */
  bg: "var(--color-setup-bg)",                       // #F5F0E8 — 따뜻한 베이지
  /* 카드 */
  card: "var(--color-setup-card)",                   // #FFFFFF — 흰색 카드
  cardBorder: "var(--color-setup-card-border)",      // #E8E0D4 — 부드러운 보더
  /* 텍스트 */
  text: "var(--color-setup-text)",                   // #3D3529 — 진한 브라운
  textSub: "var(--color-setup-text-sub)",            // #8C8070 — 보조 텍스트
  /* 액센트 (CTA, 선택 강조 등) */
  accent: "var(--color-setup-accent)",               // #D4A843 — 머스타드
  accentLight: "var(--color-setup-accent-light)",    // rgba(212,168,67,0.12) — 액센트 연한 배경
  accentHover: "var(--color-setup-accent-hover)",    // #C49A3A — 호버 시 약간 진한 톤
  /* 비활성 상태 */
  dotInactive: "var(--color-setup-dot-inactive)",    // #D4CFC6 — 인디케이터 비활성
} as const;

/* ── 2. 기본 앱 테마 토큰 (홈, 채팅 등 — globals.css 참조) ── */
export const APP_THEME = {
  bg: "var(--color-background)",
  fg: "var(--color-foreground)",
  cardBg: "var(--color-card-bg)",
  cardBorder: "var(--color-card-border)",
  surface: "var(--color-surface)",
  surfaceBorder: "var(--color-surface-border)",
  gold: "var(--color-gold)",
  accent: "var(--color-accent)",
  tabActive: "var(--color-tab-active)",
  tabInactive: "var(--color-tab-inactive)",
} as const;

/* ── 3. 공통 인라인 스타일 헬퍼 ── */

/* 따뜻한 무드 카드 기본 스타일 (선택/미선택 분기) */
export function warmCardStyle(isSelected: boolean): React.CSSProperties {
  return {
    backgroundColor: isSelected ? WARM_THEME.accentLight : WARM_THEME.card,
    border: `1.5px solid ${isSelected ? WARM_THEME.accent : WARM_THEME.cardBorder}`,
    boxShadow: isSelected
      ? `0 0 0 3px ${WARM_THEME.accentLight}`
      : "0 1px 3px rgba(0,0,0,0.04)",
  };
}

/* 따뜻한 무드 아이콘 컨테이너 스타일 (선택/미선택 분기) */
export function warmIconContainerStyle(isSelected: boolean): React.CSSProperties {
  return {
    backgroundColor: isSelected ? WARM_THEME.accent : WARM_THEME.accentLight,
    color: isSelected ? "#FFFFFF" : WARM_THEME.accent,
  };
}

/* 따뜻한 무드 CTA 버튼 스타일 (활성/비활성 분기) */
export function warmCtaStyle(isEnabled: boolean): React.CSSProperties {
  return {
    backgroundColor: isEnabled ? WARM_THEME.accent : WARM_THEME.dotInactive,
    color: isEnabled ? "#FFFFFF" : WARM_THEME.textSub,
    cursor: isEnabled ? "pointer" : "not-allowed",
  };
}

/* 따뜻한 무드 페이지 래퍼 스타일 */
export const warmPageStyle: React.CSSProperties = {
  backgroundColor: WARM_THEME.bg,
  minHeight: "100vh",
};

/* ── 4. 공통 클래스명 상수 ── */
export const COMMON_CLASSES = {
  /* 카드 라운딩 */
  cardRounded: "rounded-2xl",
  /* 버튼 라운딩 */
  btnRounded: "rounded-2xl",
  /* 트랜지션 */
  transition: "transition-all",
  /* 버튼 눌림 효과 */
  pressEffect: "active:scale-[0.97]",
  /* 전체 너비 버튼 공통 */
  fullWidthBtn: "w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.97]",
} as const;
