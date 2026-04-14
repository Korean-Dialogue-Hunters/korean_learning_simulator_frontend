/* ──────────────────────────────────────────
   API 클라이언트
   - BE 서버와 통신하는 fetch 래퍼
   - BE가 Pydantic alias_generator로 camelCase 직렬화하므로 FE/BE 모두 camelCase JSON 사용
   - 에러 핸들링 공통 처리
   ────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ── 공통 fetch 래퍼 ── */
async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const url = `${BASE_URL}${path}`;
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const elapsed = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt
  );

  if (!res.ok) {
    const errorText = await res.text();
    if (process.env.NODE_ENV !== "production") {
      console.groupCollapsed(
        `%c[API ✗] ${method} ${path} %c${res.status} %c(${elapsed}ms)`,
        "color:#ef4444;font-weight:bold",
        "color:#ef4444",
        "color:#888"
      );
      console.log("URL:", url);
      if (body) console.log("Request:", body);
      console.log("Error body:", errorText);
      console.groupEnd();
    }
    throw new Error(`API ${method} ${path} 실패 (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as T;

  if (process.env.NODE_ENV !== "production") {
    console.groupCollapsed(
      `%c[API ✓] ${method} ${path} %c${res.status} %c(${elapsed}ms)`,
      "color:#10b981;font-weight:bold",
      "color:#10b981",
      "color:#888"
    );
    console.log("URL:", url);
    if (body) console.log("Request:", body);
    console.log("Response:", json);
    console.groupEnd();
  }

  return json;
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
  UserProfileResponse,
  UserSessionsResponse,
  UserSessionsSort,
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

/* 4. 평가 요청 — 대화 종료 후 호출 (lang: LLM 피드백 언어 ko/en) */
export async function evaluateSession(
  sessionId: string,
  lang?: "ko" | "en"
): Promise<EvaluationResponse> {
  const qs = lang ? `?lang=${lang}` : "";
  return apiFetch<EvaluationResponse>(`/sessions/${sessionId}/evaluation${qs}`, {
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

/* 9. 유저 프로필 조회 */
export async function getUserProfile(
  userNickname: string
): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>(`/users/${encodeURIComponent(userNickname)}/profile`);
}

/* 10. 유저 완료 세션 목록 조회 */
export async function getUserSessions(
  userNickname: string,
  sort: UserSessionsSort = "recent"
): Promise<UserSessionsResponse> {
  const qs = new URLSearchParams({ sort }).toString();
  return apiFetch<UserSessionsResponse>(
    `/users/${encodeURIComponent(userNickname)}/sessions?${qs}`
  );
}
