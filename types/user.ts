/* ──────────────────────────────────────────
   유저 관련 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   ────────────────────────────────────────── */

// 등급 종류 (낮은 순서대로)
export type Grade = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

// 등급별 테두리 색상 (Tailwind 클래스)
export const GRADE_BORDER_COLOR: Record<Grade, string> = {
  Bronze: "border-tier-bronze",
  Silver: "border-tier-silver",
  Gold: "border-tier-gold",
  Platinum: "border-tier-platinum",
  Diamond: "border-tier-diamond",
};

// 등급별 텍스트 색상 (Tailwind 클래스)
export const GRADE_TEXT_COLOR: Record<Grade, string> = {
  Bronze: "text-tier-bronze",
  Silver: "text-tier-silver",
  Gold: "text-tier-gold",
  Platinum: "text-tier-platinum",
  Diamond: "text-tier-diamond",
};

// 등급별 실제 HEX 색상 (인라인 스타일용)
export const GRADE_COLORS: Record<Grade, string> = {
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Platinum: "#E5E4E2",
  Diamond: "#B9F2FF",
};

// 유저 프로필 데이터 구조
// BE: { user_nickname, country, korean_level, cultural_interest, latest_grade }
export interface UserProfile {
  userNickname: string;   // BE: user_nickname
  grade: Grade;           // BE: latest_grade
  xp: number;             // FE 전용 (BE 미제공)
  xpMax: number;          // FE 전용 (BE 미제공) — BE: xp_max
  xpToNext: number;       // FE 전용 (BE 미제공) — BE: xp_to_next
  avatarUrl?: string;     // FE 전용 (BE 미제공) — BE: avatar_url
}

// 주간 통계 데이터 구조
// BE: { conversation_count, average_score, latest_grade }
export interface WeeklyStats {
  conversationCount: number;  // BE: conversation_count
  averageScore: number;       // BE: average_score
  streakDays: number;         // FE 전용 (BE 미제공) — BE: streak_days
}
