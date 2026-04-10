/* ──────────────────────────────────────────
   진행 중 대화 세션 상태 헬퍼
   - localStorage에 저장 (탭 닫아도 유지)
   - 세션 진행 관련 키를 한 곳에서 관리
   ────────────────────────────────────────── */

export const ACTIVE_SESSION_KEYS = [
  "sessionId",
  "scenarioData",
  "myPersona",
  "counterpart",
  "turnLimit",
  "firstAiMessage",
  "chatMessages",
  "scene",
  "sceneEn",
  "evaluationData",
] as const;

/** 진행 중 세션 관련 저장소를 전부 비운다 */
export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  for (const key of ACTIVE_SESSION_KEYS) {
    localStorage.removeItem(key);
  }
}

/** 현재 저장된 sessionId */
export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sessionId");
}
