/* ──────────────────────────────────────────
   API 클라이언트
   - BE 서버와 통신하는 fetch 래퍼
   - FE(camelCase) ↔ BE(snake_case) 자동 변환
   - 에러 핸들링 공통 처리
   ────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ── camelCase → snake_case 변환 (요청 body용) ── */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/* ── snake_case → camelCase 변환 (응답 body용) ── */
function toCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // SCK_ 접두어 필드는 그대로 유지 (BE 고유 네이밍)
      const camelKey = key.startsWith("SCK_")
        ? key
        : key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
      result[camelKey] = toCamelCase(value);
    }
    return result;
  }
  return obj;
}

/* ── 공통 fetch 래퍼 ── */
async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(toSnakeCase(body)) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API ${method} ${path} 실패 (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  return toCamelCase(json) as T;
}

/* ══════════════════════════════════════════
   API 함수들
   ══════════════════════════════════════════ */

import type {
  CreateSessionResponse,
  SessionStateResponse,
  EvaluationResponse,
  ReviewCountResponse,
  WeeklyReviewResponse,
  WeeklyStatsResponse,
} from "@/types/api";

/* 1. 세션 생성 — 장소 선택 후 호출 */
export async function createSession(params: {
  userId: string;
  userNickname: string;
  country: string;
  koreanLevel: string;
  culturalInterest: string[];
  location: string;
}): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: {
      userId: params.userId,
      userNickname: params.userNickname,
      country: params.country,
      koreanLevel: params.koreanLevel,
      culturalInterest: params.culturalInterest,
      location: params.location,
    },
  });
}

/* 2. 역할 선택 */
export async function selectRole(
  sessionId: string,
  selectedRole: string
): Promise<SessionStateResponse> {
  return apiFetch<SessionStateResponse>(`/sessions/${sessionId}/role`, {
    method: "POST",
    body: { selectedRole },
  });
}

/* 3. 턴 진행 — 사용자 발화 전송 */
export async function createTurn(
  sessionId: string,
  userInput: string
): Promise<SessionStateResponse> {
  return apiFetch<SessionStateResponse>(`/sessions/${sessionId}/turns`, {
    method: "POST",
    body: { userInput },
  });
}

/* 4. 평가 요청 — 대화 종료 후 호출 */
export async function evaluateSession(
  sessionId: string
): Promise<EvaluationResponse> {
  return apiFetch<EvaluationResponse>(`/sessions/${sessionId}/evaluation`, {
    method: "POST",
  });
}

/* 5. 세션 조회 */
export async function getSession(
  sessionId: string
): Promise<SessionStateResponse> {
  return apiFetch<SessionStateResponse>(`/sessions/${sessionId}`);
}

/* 6. 복습 콘텐츠 개수 조회 */
export async function getReviewCount(
  userNickname: string
): Promise<ReviewCountResponse> {
  return apiFetch<ReviewCountResponse>(`/users/${encodeURIComponent(userNickname)}/review/count`);
}

/* 7. 주간 복습 콘텐츠 생성/조회 */
export async function getWeeklyReview(
  userNickname: string
): Promise<WeeklyReviewResponse> {
  return apiFetch<WeeklyReviewResponse>(`/users/${encodeURIComponent(userNickname)}/review/weekly`);
}

/* 8. 주간 통계 조회 */
export async function getWeeklyStats(
  userNickname: string
): Promise<WeeklyStatsResponse> {
  return apiFetch<WeeklyStatsResponse>(`/users/${encodeURIComponent(userNickname)}/weekly-stats`);
}
