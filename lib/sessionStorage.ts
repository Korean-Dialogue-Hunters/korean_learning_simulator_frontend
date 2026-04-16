/* 세션(대화) 1회에 귀속된 localStorage 키 모음.
   새 세션 시작/종료 시 한 번에 정리하기 위해 한 곳에서 관리. */
const SESSION_KEYS = [
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
  "viewSessionId",
] as const;

export function clearSessionState(): void {
  if (typeof window === "undefined") return;
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
}
