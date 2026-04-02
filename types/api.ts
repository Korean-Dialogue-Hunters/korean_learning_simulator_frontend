/* ──────────────────────────────────────────
   BE API 요청/응답 타입 정의
   - BE API 필드명 기준으로 통일
   ────────────────────────────────────────── */

/* ── POST /v1/sessions ── */
export interface CreateSessionRequest {
  user_nickname: string;
  country: string;
  korean_level: string;
  cultural_interest: string;
  location: string;
}

// 페르소나 한 명의 데이터 (사용자가 맡을 역할/미션)
export interface Persona {
  id: "A" | "B";
  name: string;
  age: number;
  gender: string;
  role: string;       // 역할 (예: "대학생", "친구")
  mission: string;    // 사용자의 미션 (예: "한강 자전거길을 달리다 길을 잃어 도움을 요청하는 대학생")
  avatar_url?: string;
}

// 응답: 시나리오 + 사용자가 선택할 역할 두 개
export interface CreateSessionResponse {
  session_id: string;
  scenario_title: string;
  scene: string;
  personas: Record<string, Persona>; // { A: {...}, B: {...} }
  relationship_type: string;
  dialogue_function: string;
  turn_limit: number;
  location: string;
  user_profile: Record<string, unknown>;
}

/* ── POST /v1/sessions/{id}/role ── */
export interface SelectRoleRequest {
  selected_role: string; // "A" or "B"
}

/* ── POST /v1/sessions/{id}/turns ── */
export interface CreateTurnRequest {
  user_input: string;
}

// 역할 선택 이후 세션 상태 응답 (role, turns, get 공통)
export interface SessionStateResponse {
  session_id: string;
  scenario_title: string;
  scene: string;
  personas: Record<string, Persona>;
  relationship_type: string;
  dialogue_function: string;
  turn_limit: number;
  location: string;
  user_profile: Record<string, unknown>;
  selected_role: string;
  conversation_log: ConversationEntry[];
  turn_count: number;
  is_finished: boolean;
  latest_ai_response: string;
}

// 대화 로그 한 건 (BE 형식)
export interface ConversationEntry {
  speaker: "user" | "ai";
  role: string;
  name: string;
  utterance: string;
}

/* ── POST /v1/sessions/{id}/evaluation ── */
export interface EvaluationResponse {
  session_id: string;
  conversation_log: ConversationEntry[];
  location: string;
  scenario_title: string;
  highlighted_log: HighlightedEntry[];
  total_score_10: number;
  grade: string;
  feedback: string;
  llm_summary: string;
  SCK_match_count: number;
  SCK_total_tokens: number;
  SCK_match_rate: number;
  SCK_level_counts: Record<string, number>;
  SCK_level_word_counts: Record<string, string[]>;
}

// 하이라이트된 대화 로그 한 건
export interface HighlightedEntry {
  speaker: string;
  text: string;
  highlight: string;
}
