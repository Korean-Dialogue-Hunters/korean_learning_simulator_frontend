/* ──────────────────────────────────────────
   채팅 관련 타입 정의
   - BE API 필드명 기준으로 통일
   ────────────────────────────────────────── */

/** 채팅 메시지 발신자 */
export type MessageSender = "user" | "ai";

/** 채팅 메시지 한 건 (FE 내부용, BE conversation_log와 매핑) */
export interface ChatMessage {
  id: string;              // FE 전용 (고유 식별)
  speaker: MessageSender;  // BE: speaker
  utterance: string;       // BE: utterance
  timestamp: number;       // FE 전용
}

/** 채팅 세션 상태 */
export interface ChatSession {
  session_id: string;
  selected_role: "A" | "B";
  persona_name: string;
  turn_limit: number;
  turns_left: number;
  is_finished: boolean;
  messages: ChatMessage[];
}
