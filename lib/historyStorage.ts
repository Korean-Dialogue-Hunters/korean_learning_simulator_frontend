/* ──────────────────────────────────────────
   평가 결과 캐시 (localStorage)
   - 결과 페이지 재진입 시 BE 재호출 없이 즉시 표시
   - sessionId 키로 EvaluationResponse 캐싱
   - 대화 기록 자체는 BE GET /v1/users/{nickname}/sessions에서 조회
   ────────────────────────────────────────── */

const EVAL_CACHE_KEY = "evaluationCache";

function getEvaluationCacheAll(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EVAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 평가 결과 캐시 저장 */
export function saveEvaluationCache(sessionId: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const cache = getEvaluationCacheAll();
    cache[sessionId] = data;
    localStorage.setItem(EVAL_CACHE_KEY, JSON.stringify(cache));
  } catch { /* localStorage 용량 초과 등 무시 */ }
}

/** 평가 결과 캐시 조회 — 없으면 null */
export function getEvaluationCache(sessionId: string): unknown | null {
  const cache = getEvaluationCacheAll();
  return cache[sessionId] ?? null;
}

/** 평가 결과 캐시 삭제 */
export function removeEvaluationCache(sessionId: string): void {
  if (typeof window === "undefined") return;
  const cache = getEvaluationCacheAll();
  delete cache[sessionId];
  localStorage.setItem(EVAL_CACHE_KEY, JSON.stringify(cache));
}
