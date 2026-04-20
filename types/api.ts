/* ──────────────────────────────────────────
   BE API 요청/응답 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (lib/api.ts에서 자동 변환)
   ────────────────────────────────────────── */

/* ── POST /v1/sessions ── */
export interface CreateSessionRequest {
  userId: string;             // BE: user_id (UUID)
  userNickname: string;       // BE: user_nickname
  country: string;
  koreanLevel: string;        // BE: korean_level
  culturalInterest: string[]; // BE: cultural_interest
  location: string;
}

// 페르소나 한 명의 데이터 (사용자가 맡을 역할/미션)
export interface Persona {
  id: "A" | "B";
  name: string;
  age: number;
  gender: string;
  genderEn?: string;
  role: string;
  roleEn?: string;
  mission: string;
  missionEn?: string;
  personaUrl?: string;
}

// POST /v1/sessions 응답 — 역할 선택 전 상태
export interface CreateSessionResponse {
  sessionId: string;                       // BE: session_id
  userProfile: Record<string, unknown>;    // BE: user_profile
  koreanLevel: string;                     // BE: korean_level
  location: string;
  scenarioTitle: string;                   // BE: scenario_title
  scenarioTitleEn?: string;
  scene: string;
  sceneEn?: string;
  personas: Record<string, Persona>;
  relationshipType: string;                // BE: relationship_type
  dialogueFunction: string;                // BE: dialogue_function
  turnLimit: number;                       // BE: turn_limit
}

/* ── POST /v1/sessions/{id}/role ── */
export interface SelectRoleRequest {
  selectedRole: string;   // BE: selected_role — "A" or "B"
}

/* ── POST /v1/sessions/{id}/turns ── */
export interface CreateTurnRequest {
  userInput: string;   // BE: user_input
}

// 역할 선택 이후 세션 상태 응답 (role, turns, get 공통)
export interface SessionStateResponse extends CreateSessionResponse {
  selectedRole: string;                    // BE: selected_role
  conversationLog: ConversationEntry[];    // BE: conversation_log
  turnCount: number;                       // BE: turn_count
  isFinished: boolean;                     // BE: is_finished
  latestAiResponse: string;                // BE: latest_ai_response
  createdAt: string;                       // BE: created_at
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
  sessionId: string;                              // BE: session_id
  conversationLog: ConversationEntry[];           // BE: conversation_log
  location: string;
  scenarioTitle: string;                          // BE: scenario_title
  scene: string;
  wrongWordPool: string[];                        // BE: wrong_word_pool — "틀린->교정" 형식
  lengthScore: number;                            // BE: length_score — 발화 길이 점수
  vocabScore: number;                             // BE: vocab_score — 어휘 점수
  contextScore: number;                           // BE: context_score — 맥락 점수 (레거시)
  contextSceneMissionMatch: number;               // BE: context_scene_mission_match (0/2/4/6/8/10)
  contextRelationshipMatch: number;               // BE: context_relationship_match (0/2/4/6/8/10)
  spellingScore: number;                          // BE: spelling_score
  totalScore10: number;                           // BE: total_score_10
  grade: string;                                  // BE: grade — "Beginner <B>" 형태
  feedback: string;
  feedbackEn?: string;                            // BE: feedback_en
  llmSummary: string;                             // BE: llm_summary
  llmSummaryEn?: string;                          // BE: llm_summary_en
  sckMatchCount: number;                          // BE: SCK_match_count
  sckTotalTokens: number;                         // BE: SCK_total_tokens
  sckMatchRate: number;                           // BE: SCK_match_rate
  sckLevelCounts: Record<string, number>;         // BE: SCK_level_counts
  sckLevelWordCounts: Record<string, Record<string, number | { count: number; index: string }>>;   // BE: SCK_level_word_counts
  /* 평가 직후 자동 강등 결과 — 자격 미달이면 null */
  levelDown?: LevelDownOutcome | null;            // BE: level_down
}

/* 평가 응답 안에 포함되는 자동 강등 결과 */
export interface LevelDownOutcome {
  applied: boolean;
  previousLevel: number;   // BE: previous_level
  newLevel: number;        // BE: new_level
}

/* ── GET /v1/users/{nickname}/review/count ── */
export interface ReviewCountResponse {
  userId: string;                // BE: user_id
  userNickname: string;          // BE: user_nickname
  chosungQuizCount: number;      // BE: chosung_quiz_count
  flashcardCount: number;        // BE: flashcard_count
}

/* ── GET /v1/users/{nickname}/review/weekly ── */
export interface ChosungQuizItem {
  [key: string]: unknown;
}

export interface FlashcardItem {
  word: string;
  meaning: string;
  [key: string]: unknown;
}

export interface WeeklyReviewResponse {
  userProfile: Record<string, unknown>;                                     // BE: user_profile
  justBeforeSession: { sessionId: string; totalScore10: number; [key: string]: unknown }[]; // BE: just_before_session
  wrongWordPool: string[];                                                  // BE: wrong_word_pool
  chosungQuiz: ChosungQuizItem[];                                           // BE: chosung_quiz
  flashcards: FlashcardItem[];
}

/* ── GET /v1/users/{nickname}/weekly-stats ── */
export interface WeeklyStatsResponse {
  userId: string;                // BE: user_id
  userNickname: string;          // BE: user_nickname
  sessionsPerUserCount: number;  // BE: sessions_per_user_count
  averageScore: number;          // BE: average_score
  latestGrade: string;           // BE: latest_grade
  streakDays: number;            // BE: streak_days
}

/* ── GET /v1/users/{nickname}/profile ── */
export interface UserProfileResponse {
  userId: string;                // BE: user_id
  userNickname: string;          // BE: user_nickname
  country: string;
  koreanLevel: number;           // BE: korean_level (정수 1~6)
  culturalInterest: string[];    // BE: cultural_interest
  latestGrade: string;           // BE: latest_grade
  averageScore: number;          // BE: average_score — 평균 점수
  totalConversations: number;    // BE: total_conversations — 총 완료 세션 수
  streakDays: number;            // BE: streak_days — 연속 학습 일수
}

/* ── GET /v1/users/{user_id}/level-up/eligibility ── */
export interface LevelUpEligibilityResponse {
  currentLevel: number;          // BE: current_level
  nextLevel: number | null;      // BE: next_level — 최고 레벨이면 null
  eligible: boolean;             // 승급 자격 여부
  completedSessions: number;     // BE: completed_sessions — 완료 세션 수
  requiredSessions: number;      // BE: required_sessions — 필요한 세션 수
  averageScore: number;          // BE: average_score
  requiredScore: number;         // BE: required_score — 필요한 평균 점수
}

/* ── POST /v1/sessions/exam ── */
export interface CreateExamRequest {
  userId: string;                // BE: user_id (UUID)
  location: string;
}

/* ── POST /v1/sessions/{id}/exam ── */
export interface ExamResultResponse {
  status: "CONVERSATION_PASSED" | "FAIL" | string;
  message: string;
  score: number;                 // 시험 점수 (10점 만점)
  passed: boolean;               // 8점 이상이면 true
  previousLevel: number | null;  // BE: previous_level
  newLevel: number | null;       // BE: new_level
}

/* ── GET /v1/users/{user_id}/level-down/eligibility ── */
export interface LevelDownEligibilityResponse {
  currentLevel: number;          // BE: current_level
  previousLevel: number | null;  // BE: previous_level — 최저(1급)면 null
  eligible: boolean;
  completedSessions: number;     // BE: completed_sessions
  requiredSessions: number;      // BE: required_sessions
  averageScore: number;          // BE: average_score — 최근 5회 평균
  thresholdScore: number;        // BE: threshold_score — 강등 임계 (기본 4.0)
}

/* ── POST /v1/users/{user_id}/level-down/apply ── */
export interface LevelDownApplyResponse {
  userId: string;                // BE: user_id
  previousLevel: number;         // BE: previous_level
  newLevel: number;              // BE: new_level
  applied: boolean;              // 실제 강등 적용 여부
}

/* ── GET /v1/users/{nickname}/sessions ── */
export type UserSessionsSort =
  | "recent"
  | "oldest"
  | "score_high"
  | "score_low"
  | "location";

export interface UserSessionItem {
  sessionId: string;             // BE: session_id
  scenarioTitle: string;         // BE: scenario_title
  location: string;
  scene: string;
  koreanLevel: number;           // BE: korean_level — 대화 진행 시 레벨(1~6, 벨트 색상 매핑)
  totalScore10: number;          // BE: total_score_10
  grade: string;
  turnCount: number;             // BE: turn_count
  turnLimit: number;             // BE: turn_limit
  createdAt: string;             // BE: created_at
  chosungQuizPassed?: boolean;   // BE: chosung_quiz_passed — 초성퀴즈 정답률 75%+ 통과
  flashcardDone?: boolean;       // BE: flashcard_done — 플래시카드 전체 완료
}

/* ── 세션 진척도 ──
   별 3개: ① 대화 완료 ② 초성퀴즈 정답률 75%+ ③ 플래시카드 완료
   BE 응답 우선, 없으면 FE localStorage 폴백 */
export interface SessionProgress {
  completed: boolean;            // 대화 완료 여부 (기록에 있으면 항상 true)
  chosungQuizPassed: boolean;    // 초성퀴즈 정답률 75% 이상
  flashcardDone: boolean;        // 플래시카드 전체 암기 완료
}

export interface UserSessionsResponse {
  sessions: UserSessionItem[];
  totalCount: number;            // BE: total_count
}

/* ── POST /v1/users/{nickname}/review/quiz-result ── */
export interface QuizResultRequest {
  sessionId: string;             // BE: session_id
  correctCount: number;          // BE: correct_count — 맞은 개수
}

export interface QuizResultResponse {
  sessionId: string;             // BE: session_id
  correctCount: number;          // BE: correct_count
  totalCount: number;            // BE: total_count — 세션 끝에 자동 저장된 값
  passed: boolean;               // 4/5 이상이면 true
}

/* ── POST /v1/users/{nickname}/review/flashcard-result ── */
export interface FlashcardResultRequest {
  sessionId: string;             // BE: session_id
  completedCount: number;        // BE: completed_count — 암기 완료 개수
}

export interface FlashcardResultResponse {
  sessionId: string;             // BE: session_id
  completedCount: number;        // BE: completed_count
  totalCount: number;            // BE: total_count — 세션 끝에 자동 저장된 값
  allDone: boolean;              // 전부 완료하면 true
}
