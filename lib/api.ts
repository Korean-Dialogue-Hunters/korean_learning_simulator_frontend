/* ──────────────────────────────────────────
   API 클라이언트
   - BE 서버와 통신하는 fetch 래퍼
   - BE가 Pydantic alias_generator로 camelCase 직렬화하므로 FE/BE 모두 camelCase JSON 사용
   - 에러 핸들링 공통 처리
   ────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ──────────────────────────────────────────
   personas 내부 snake_case _en 필드 → camelCase 정규화
   - BE Pydantic은 top-level 필드에만 camelCase alias를 적용함.
   - `personas: dict[str, dict[str, Any]]`는 내부 키에 alias 미적용 →
     LLM이 만든 `role_en`/`mission_en`/`gender_en`/`scene_en`이 snake_case로 그대로 전달됨.
   - 여기서 camelCase로 복사해 FE의 Persona 타입과 맞춤. (원본 키도 유지)
   ────────────────────────────────────────── */
function normalizePersonas<T>(res: T): T {
  const anyRes = res as unknown as { personas?: Record<string, Record<string, unknown>> };
  if (!anyRes || !anyRes.personas) return res;
  const SNAKE_TO_CAMEL: Record<string, string> = {
    role_en: "roleEn",
    mission_en: "missionEn",
    gender_en: "genderEn",
    scene_en: "sceneEn",
    persona_url: "personaUrl",
  };
  for (const key of Object.keys(anyRes.personas)) {
    const p = anyRes.personas[key];
    if (!p || typeof p !== "object") continue;
    for (const [sk, ck] of Object.entries(SNAKE_TO_CAMEL)) {
      if (p[sk] !== undefined && p[ck] === undefined) {
        p[ck] = p[sk];
      }
    }
  }
  return res;
}

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
  QuizResultResponse,
  FlashcardResultResponse,
  LevelUpEligibilityResponse,
  ExamResultResponse,
  LevelDownEligibilityResponse,
  LevelDownApplyResponse,
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
  const res = await apiFetch<CreateSessionResponse>("/sessions", {
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
  return normalizePersonas(res);
}

/* 2. 역할 선택 */
export async function selectRole(
  sessionId: string,
  selectedRole: string
): Promise<SessionStateResponse> {
  const res = await apiFetch<SessionStateResponse>(`/sessions/${sessionId}/role`, {
    method: "POST",
    body: { selectedRole },
  });
  return normalizePersonas(res);
}

/* 3. 턴 진행 — 사용자 발화 전송 */
export async function createTurn(
  sessionId: string,
  userInput: string
): Promise<SessionStateResponse> {
  const res = await apiFetch<SessionStateResponse>(`/sessions/${sessionId}/turns`, {
    method: "POST",
    body: { userInput },
  });
  return normalizePersonas(res);
}

/* 4. 평가 요청 — 대화 종료 후 호출 (lang: LLM 피드백 언어 ko/en) */
export async function evaluateSession(
  sessionId: string,
  lang?: "ko" | "en"
): Promise<EvaluationResponse> {
  const qs = lang ? `?lang=${lang}` : "";
  const raw = await apiFetch<EvaluationResponse>(`/sessions/${sessionId}/evaluation${qs}`, {
    method: "POST",
  });
  return normalizeSckFields(raw);
}

/* BE가 SCK 필드만 대문자 snake_case로 반환 → camelCase 정규화 */
export function normalizeSckFields(res: EvaluationResponse): EvaluationResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = res as any;
  const SCK_MAP: [string, keyof EvaluationResponse][] = [
    ["SCKMatchCount", "sckMatchCount"],
    ["SCKTotalTokens", "sckTotalTokens"],
    ["SCKMatchRate", "sckMatchRate"],
    ["SCKLevelCounts", "sckLevelCounts"],
    ["SCKLevelWordCounts", "sckLevelWordCounts"],
  ];
  if (process.env.NODE_ENV !== "production") {
    const sckKeys = Object.keys(r).filter((k) => /sck|SCK/i.test(k));
    console.log("[SCK debug] keys found:", sckKeys, "values:", Object.fromEntries(sckKeys.map((k) => [k, r[k]])));
  }
  for (const [snake, camel] of SCK_MAP) {
    if (r[snake] !== undefined && r[camel] === undefined) {
      r[camel] = r[snake];
    }
  }
  return r;
}

/* 5. 세션 조회 */
export async function getSession(
  sessionId: string
): Promise<SessionStateResponse> {
  const res = await apiFetch<SessionStateResponse>(`/sessions/${sessionId}`);
  return normalizePersonas(res);
}

/* 6. 복습 콘텐츠 개수 조회 */
export async function getReviewCount(
  userId: string
): Promise<ReviewCountResponse> {
  return apiFetch<ReviewCountResponse>(`/users/${encodeURIComponent(userId)}/review/count`);
}

/* 7. 주간 복습 콘텐츠 생성/조회
   - sessionId 전달 시 BE가 해당 세션의 chosung_quiz/flashcards만 DB에서 로드
   - 생략 시 기존 동작(전체 세션 기반) — BE Option A 적용 전까지 호환 */
export async function getWeeklyReview(
  userId: string,
  sessionId?: string
): Promise<WeeklyReviewResponse> {
  const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  return apiFetch<WeeklyReviewResponse>(`/users/${encodeURIComponent(userId)}/review/weekly${qs}`);
}

/* 8. 주간 통계 조회 */
export async function getWeeklyStats(
  userId: string
): Promise<WeeklyStatsResponse> {
  return apiFetch<WeeklyStatsResponse>(`/users/${encodeURIComponent(userId)}/weekly-stats`);
}

/* 9. 유저 프로필 조회 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>(`/users/${encodeURIComponent(userId)}/profile`);
}

/* 10. 유저 완료 세션 목록 조회 */
export async function getUserSessions(
  userId: string,
  sort: UserSessionsSort = "recent"
): Promise<UserSessionsResponse> {
  const qs = new URLSearchParams({ sort }).toString();
  const res = await apiFetch<UserSessionsResponse>(
    `/users/${encodeURIComponent(userId)}/sessions?${qs}`
  );
  /* BE가 별 진척도 필드를 snake_case로 내려줄 수 있으므로 camelCase로 정규화 */
  res.sessions = res.sessions.map((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = s as any;
    if (s.chosungQuizPassed === undefined && raw.chosung_quiz_passed !== undefined) {
      s.chosungQuizPassed = raw.chosung_quiz_passed;
    }
    if (s.flashcardDone === undefined && raw.flashcard_done !== undefined) {
      s.flashcardDone = raw.flashcard_done;
    }
    return s;
  });
  return res;
}

/* 11. 초성퀴즈 결과 저장 */
export async function submitQuizResult(
  userId: string,
  sessionId: string,
  correctCount: number
): Promise<QuizResultResponse> {
  return apiFetch<QuizResultResponse>(
    `/users/${encodeURIComponent(userId)}/review/quiz-result`,
    { method: "POST", body: { sessionId, correctCount } }
  );
}

/* 12. 플래시카드 완료 결과 저장 */
export async function submitFlashcardResult(
  userId: string,
  sessionId: string,
  completedCount: number
): Promise<FlashcardResultResponse> {
  return apiFetch<FlashcardResultResponse>(
    `/users/${encodeURIComponent(userId)}/review/flashcard-result`,
    { method: "POST", body: { sessionId, completedCount } }
  );
}

/* 13. 승급 자격 조회 */
export async function getLevelUpEligibility(
  userId: string
): Promise<LevelUpEligibilityResponse> {
  return apiFetch<LevelUpEligibilityResponse>(
    `/users/${encodeURIComponent(userId)}/level-up/eligibility`
  );
}

/* 14. 승급 시험 세션 생성
   BE가 현재 korean_level + 1 난이도로 시나리오를 준비함.
   응답 스키마는 일반 /sessions 생성과 동일 (CreateSessionResponse 재사용). */
export async function createExamSession(
  userId: string,
  location: string
): Promise<CreateSessionResponse> {
  const res = await apiFetch<CreateSessionResponse>("/sessions/exam", {
    method: "POST",
    body: { userId, location },
  });
  return normalizePersonas(res);
}

/* 15. 승급 시험 평가 — 통과 시 BE가 korean_level 자동 증가 */
export async function evaluateExamSession(
  sessionId: string
): Promise<ExamResultResponse> {
  return apiFetch<ExamResultResponse>(`/sessions/${sessionId}/exam`, {
    method: "POST",
  });
}

/* 16. 강등 자격 조회 — 현재 레벨 완료 5회+ 최근 평균 < 4.0 */
export async function getLevelDownEligibility(
  userId: string
): Promise<LevelDownEligibilityResponse> {
  return apiFetch<LevelDownEligibilityResponse>(
    `/users/${encodeURIComponent(userId)}/level-down/eligibility`
  );
}

/* 17. 강등 수동 적용
   - 평가 직후 BE가 자동으로도 적용하지만, 수동 트리거가 필요할 때 사용.
   - 응답의 applied=false면 자격 미달로 변경 없음. */
export async function applyLevelDown(
  userId: string
): Promise<LevelDownApplyResponse> {
  return apiFetch<LevelDownApplyResponse>(
    `/users/${encodeURIComponent(userId)}/level-down/apply`,
    { method: "POST" }
  );
}
