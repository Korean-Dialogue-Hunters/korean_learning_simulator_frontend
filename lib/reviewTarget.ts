/* ──────────────────────────────────────────
   복습 대상 세션 선택 로직
   - 점수 낮은 순 정렬된 세션 목록에서
     퀴즈·플래시카드를 둘 다 완료하지 않은 첫 세션을 반환
   ────────────────────────────────────────── */

import type { UserSessionItem } from "@/types/api";

export interface StarData {
  quizPassed?: boolean;
  flashcardDone?: boolean;
}

/**
 * 점수 오름차순 정렬된 세션 목록에서 첫 번째 미완료 세션을 반환.
 * @param sortedSessions  점수 낮은 순 정렬된 세션 목록
 * @param getLocalProgress  localStorage 폴백 조회 함수
 */
export function findReviewTarget(
  sortedSessions: UserSessionItem[],
  getLocalProgress: (sessionId: string) => StarData = () => ({}),
): UserSessionItem | null {
  for (const s of sortedSessions) {
    const local = getLocalProgress(s.sessionId);
    const q = s.chosungQuizPassed ?? local.quizPassed ?? false;
    const f = s.flashcardDone ?? local.flashcardDone ?? false;
    if (!(q && f)) return s;
  }
  return null;
}
