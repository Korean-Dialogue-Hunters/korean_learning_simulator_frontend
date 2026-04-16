/* ──────────────────────────────────────────
   유저 관련 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   ────────────────────────────────────────── */

// 등급 종류 (높은 순서대로)
export type Grade = "S" | "A" | "B" | "C";

// 등급별 HEX 색상 (인라인 스타일용)
export const GRADE_COLORS: Record<string, string> = {
  S: "#DC3C3C",
  A: "#E8672A",
  B: "#2A8ED8",
  C: "#888888",
};

// 유저 프로필 데이터 구조
// BE: { user_nickname, country, korean_level, cultural_interest, latest_grade }
export interface UserProfile {
  userNickname: string;   // BE: user_nickname
  grade: Grade;           // BE: latest_grade
  koreanLevel: number;    // BE: korean_level (1~6, 태권도 벨트 매핑)
  level: number;          // XP 시스템 레벨
  xp: number;             // 현재 레벨 내 누적 XP
  xpMax: number;          // 현재 레벨 → 다음 레벨 필요 XP
  xpToNext: number;       // 다음 레벨까지 남은 XP
  avatarUrl?: string;     // FE 전용 (BE 미제공) — BE: avatar_url
}

// 주간 통계 데이터 구조
// BE: { sessions_per_user_count, average_score, latest_grade, streak_days }
export interface WeeklyStats {
  sessionsPerUserCount: number;  // BE: sessions_per_user_count
  averageScore: number;          // BE: average_score
  streakDays: number;            // BE: streak_days
}
