/* ──────────────────────────────────────────
   채팅 관련 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   ────────────────────────────────────────── */

/** 채팅 메시지 발신자 */
export type MessageSender = "user" | "ai";

/** 채팅 메시지 한 건 (FE 내부용, BE conversation_log와 매핑) */
export interface ChatMessage {
  id: string;              // FE 전용 (고유 식별)
  speaker: MessageSender;  // BE: speaker
  utterance: string;       // BE: utterance
  timestamp: number;       // FE 전용 (BE 미제공)
}

/** 채팅 세션 상태 */
// BE: { session_id, selected_role, turn_limit, is_finished }
export interface ChatSession {
  sessionId: string;          // BE: session_id
  selectedRole: "A" | "B";   // BE: selected_role
  personaName: string;        // FE 전용
  turnLimit: number;          // BE: turn_limit
  turnsLeft: number;          // FE 전용 (turnLimit - turnCount)
  isFinished: boolean;        // BE: is_finished
  messages: ChatMessage[];
}
