/* ──────────────────────────────────────────
   유저 관련 타입 정의
   - BE API 필드명 기준으로 통일
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
export interface UserProfile {
  user_nickname: string;  // 예: "learner_42"
  grade: Grade;           // 현재 등급
  xp: number;             // 현재 XP (BE 미제공, FE 자체)
  xp_max: number;         // 현재 등급 최대 XP (BE 미제공, FE 자체)
  xp_to_next: number;     // 다음 등급까지 남은 XP (BE 미제공, FE 자체)
  avatar_url?: string;    // 프로필 이미지 URL (없으면 이니셜 표시)
}

// 주간 통계 데이터 구조
export interface WeeklyStats {
  conversation_count: number; // 이번 주 대화 수
  average_score: number;      // 평균 점수 (0~10)
  streak_days: number;        // 연속 학습일 수 (BE 미제공, FE 자체)
}
