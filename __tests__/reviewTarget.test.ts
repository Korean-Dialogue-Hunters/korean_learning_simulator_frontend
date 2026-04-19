/* ──────────────────────────────────────────
   복습 대상 세션 선택 로직 테스트
   - findReviewTarget: 점수 낮은 순 목록에서 미완료 세션 선택
   ────────────────────────────────────────── */

import { findReviewTarget, StarData } from "@/lib/reviewTarget";
import type { UserSessionItem } from "@/types/api";

/* ── 테스트용 세션 팩토리 ── */
function makeSession(
  overrides: Partial<UserSessionItem> & { sessionId: string; totalScore10: number },
): UserSessionItem {
  return {
    scenarioTitle: "테스트 시나리오",
    location: "한강",
    scene: "산책",
    grade: "<B>",
    turnCount: 5,
    turnLimit: 8,
    createdAt: "2026-04-19T00:00:00Z",
    chosungQuizPassed: undefined,
    flashcardDone: undefined,
    ...overrides,
  };
}

/* 점수 오름차순 (score_low) 정렬된 세션 목록 — BE 응답과 동일한 순서 */
const SORTED_SESSIONS: UserSessionItem[] = [
  makeSession({ sessionId: "s1", totalScore10: 3.2, chosungQuizPassed: true,  flashcardDone: true }),
  makeSession({ sessionId: "s2", totalScore10: 4.1, chosungQuizPassed: false, flashcardDone: true }),
  makeSession({ sessionId: "s3", totalScore10: 5.5, chosungQuizPassed: false, flashcardDone: false }),
  makeSession({ sessionId: "s4", totalScore10: 7.0, chosungQuizPassed: true,  flashcardDone: false }),
  makeSession({ sessionId: "s5", totalScore10: 9.2, chosungQuizPassed: false, flashcardDone: false }),
];

describe("findReviewTarget", () => {
  /* ── 기본 선택: 최저점 + 미완료 ── */
  it("최저점 세션이 이미 완료되면 스킵하고 다음 최저점 미완료 세션을 선택한다", () => {
    const result = findReviewTarget(SORTED_SESSIONS);
    // s1(3.2)은 둘 다 완료 → 스킵, s2(4.1)는 퀴즈 미완료 → 선택
    expect(result?.sessionId).toBe("s2");
  });

  /* ── 퀴즈만 완료된 세션도 타겟 ── */
  it("플래시카드만 미완료인 세션도 타겟으로 선택된다", () => {
    const sessions = [
      makeSession({ sessionId: "s1", totalScore10: 3.0, chosungQuizPassed: true, flashcardDone: false }),
    ];
    const result = findReviewTarget(sessions);
    expect(result?.sessionId).toBe("s1");
  });

  /* ── 플래시카드만 완료된 세션도 타겟 ── */
  it("퀴즈만 미완료인 세션도 타겟으로 선택된다", () => {
    const sessions = [
      makeSession({ sessionId: "s1", totalScore10: 3.0, chosungQuizPassed: false, flashcardDone: true }),
    ];
    const result = findReviewTarget(sessions);
    expect(result?.sessionId).toBe("s1");
  });

  /* ── 전부 완료 → null ── */
  it("모든 세션이 완료되면 null을 반환한다", () => {
    const allDone = [
      makeSession({ sessionId: "s1", totalScore10: 3.0, chosungQuizPassed: true, flashcardDone: true }),
      makeSession({ sessionId: "s2", totalScore10: 5.0, chosungQuizPassed: true, flashcardDone: true }),
    ];
    expect(findReviewTarget(allDone)).toBeNull();
  });

  /* ── 빈 목록 → null ── */
  it("세션이 없으면 null을 반환한다", () => {
    expect(findReviewTarget([])).toBeNull();
  });

  /* ── localStorage 폴백: BE 필드 없을 때 로컬 값 사용 ── */
  it("BE 필드가 undefined이면 localStorage 폴백으로 완료 여부를 판단한다", () => {
    const sessions = [
      makeSession({ sessionId: "s1", totalScore10: 3.0 }), // BE 필드 둘 다 undefined
      makeSession({ sessionId: "s2", totalScore10: 5.0 }),
    ];
    // s1은 로컬에서 둘 다 완료 → 스킵, s2 선택
    const localProgress: Record<string, StarData> = {
      s1: { quizPassed: true, flashcardDone: true },
    };
    const result = findReviewTarget(sessions, (id) => localProgress[id] ?? {});
    expect(result?.sessionId).toBe("s2");
  });

  /* ── BE 값이 false면 로컬 true여도 BE 우선 ── */
  it("BE가 명시적으로 false를 내려주면 localStorage 값을 무시한다", () => {
    const sessions = [
      makeSession({ sessionId: "s1", totalScore10: 3.0, chosungQuizPassed: false, flashcardDone: false }),
    ];
    // 로컬에서는 완료라고 해도 BE가 false → 미완료 → 타겟
    const localProgress: Record<string, StarData> = {
      s1: { quizPassed: true, flashcardDone: true },
    };
    const result = findReviewTarget(sessions, (id) => localProgress[id] ?? {});
    expect(result?.sessionId).toBe("s1");
  });

  /* ── 점수 순서 보장: 항상 가장 낮은 점수의 미완료 세션 ── */
  it("여러 미완료 세션 중 점수가 가장 낮은 것을 선택한다", () => {
    const sessions = [
      makeSession({ sessionId: "s1", totalScore10: 2.0, chosungQuizPassed: true, flashcardDone: true }),
      makeSession({ sessionId: "s2", totalScore10: 4.0 }),
      makeSession({ sessionId: "s3", totalScore10: 6.0 }),
      makeSession({ sessionId: "s4", totalScore10: 8.0 }),
    ];
    // s1 완료 → 스킵, s2(4.0)·s3(6.0)·s4(8.0) 미완료 → 최저인 s2
    const result = findReviewTarget(sessions);
    expect(result?.sessionId).toBe("s2");
  });
});
