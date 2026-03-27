/* ──────────────────────────────────────────
   유저 관련 타입 정의
   - BE API 연동 전까지 mock data와 함께 사용
   ────────────────────────────────────────── */

// 티어 종류 (낮은 순서대로)
export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

// 티어별 테두리 색상 (Tailwind 클래스)
export const TIER_BORDER_COLOR: Record<Tier, string> = {
  Bronze: "border-tier-bronze",
  Silver: "border-tier-silver",
  Gold: "border-tier-gold",
  Platinum: "border-tier-platinum",
  Diamond: "border-tier-diamond",
};

// 티어별 텍스트 색상 (Tailwind 클래스)
export const TIER_TEXT_COLOR: Record<Tier, string> = {
  Bronze: "text-tier-bronze",
  Silver: "text-tier-silver",
  Gold: "text-tier-gold",
  Platinum: "text-tier-platinum",
  Diamond: "text-tier-diamond",
};

// 유저 프로필 데이터 구조
export interface UserProfile {
  userId: string;       // 예: "learner_42"
  tier: Tier;           // 현재 티어
  xp: number;           // 현재 XP
  xpMax: number;        // 현재 티어 최대 XP
  xpToNextTier: number; // 다음 티어까지 남은 XP
  avatarUrl?: string;   // 프로필 이미지 URL (없으면 이니셜 표시)
}

// 주간 통계 데이터 구조
export interface WeeklyStats {
  conversationCount: number; // 이번 주 대화 수
  averageScore: number;      // 평균 점수 (0~10)
  streakDays: number;        // 연속 학습일 수
}
