/* ──────────────────────────────────────────
   BE API 요청/응답 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   - 연동 시 변환 레이어 필요: camelCase ↔ snake_case
   ────────────────────────────────────────── */

/* ── POST /v1/sessions ── */
// BE: { user_nickname, country, korean_level, cultural_interest, location }
export interface CreateSessionRequest {
  userNickname: string;       // BE: user_nickname
  country: string;            // BE: country
  koreanLevel: string;        // BE: korean_level
  culturalInterest: string;   // BE: cultural_interest
  location: string;           // BE: location
}

// 페르소나 한 명의 데이터 (사용자가 맡을 역할/미션)
export interface Persona {
  id: "A" | "B";
  name: string;
  age: number;
  gender: string;
  role: string;        // 역할 (예: "대학생", "친구")
  mission: string;     // 사용자의 미션
  avatarUrl?: string;  // BE: avatar_url
}

// 응답: 시나리오 + 사용자가 선택할 역할 두 개
// BE: { session_id, scenario_title, scene, personas, relationship_type, dialogue_function, turn_limit, location, user_profile }
export interface CreateSessionResponse {
  sessionId: string;                       // BE: session_id
  scenarioTitle: string;                   // BE: scenario_title
  scene: string;
  personas: Record<string, Persona>;       // { A: {...}, B: {...} }
  relationshipType: string;                // BE: relationship_type
  dialogueFunction: string;                // BE: dialogue_function
  turnLimit: number;                       // BE: turn_limit
  location: string;
  userProfile: Record<string, unknown>;    // BE: user_profile
}

/* ── POST /v1/sessions/{id}/role ── */
// BE: { selected_role }
export interface SelectRoleRequest {
  selectedRole: string;   // BE: selected_role — "A" or "B"
}

/* ── POST /v1/sessions/{id}/turns ── */
// BE: { user_input }
export interface CreateTurnRequest {
  userInput: string;   // BE: user_input
}

// 역할 선택 이후 세션 상태 응답 (role, turns, get 공통)
// BE: { session_id, scenario_title, scene, personas, relationship_type, dialogue_function,
//       turn_limit, location, user_profile, selected_role, conversation_log,
//       turn_count, is_finished, latest_ai_response }
export interface SessionStateResponse {
  sessionId: string;                       // BE: session_id
  scenarioTitle: string;                   // BE: scenario_title
  scene: string;
  personas: Record<string, Persona>;
  relationshipType: string;                // BE: relationship_type
  dialogueFunction: string;                // BE: dialogue_function
  turnLimit: number;                       // BE: turn_limit
  location: string;
  userProfile: Record<string, unknown>;    // BE: user_profile
  selectedRole: string;                    // BE: selected_role
  conversationLog: ConversationEntry[];    // BE: conversation_log
  turnCount: number;                       // BE: turn_count
  isFinished: boolean;                     // BE: is_finished
  latestAiResponse: string;               // BE: latest_ai_response
}

// 대화 로그 한 건 (BE 형식)
export interface ConversationEntry {
  speaker: "user" | "ai";
  role: string;
  name: string;
  utterance: string;
}

/* ── POST /v1/sessions/{id}/evaluation ── */
// BE: { session_id, conversation_log, location, scenario_title, highlighted_log,
//       total_score_10, grade, feedback, llm_summary,
//       SCK_match_count, SCK_total_tokens, SCK_match_rate, SCK_level_counts, SCK_level_word_counts }
export interface EvaluationResponse {
  sessionId: string;                              // BE: session_id
  conversationLog: ConversationEntry[];           // BE: conversation_log
  location: string;
  scenarioTitle: string;                          // BE: scenario_title
  highlightedLog: HighlightedEntry[];             // BE: highlighted_log
  totalScore10: number;                           // BE: total_score_10
  grade: string;
  feedback: string;
  llmSummary: string;                             // BE: llm_summary
  sckMatchCount: number;                          // BE: SCK_match_count
  sckTotalTokens: number;                         // BE: SCK_total_tokens
  sckMatchRate: number;                           // BE: SCK_match_rate
  sckLevelCounts: Record<string, number>;         // BE: SCK_level_counts
  sckLevelWordCounts: Record<string, string[]>;   // BE: SCK_level_word_counts
}

// 하이라이트된 대화 로그 한 건
export interface HighlightedEntry {
  speaker: string;
  text: string;
  highlight: string;
}
