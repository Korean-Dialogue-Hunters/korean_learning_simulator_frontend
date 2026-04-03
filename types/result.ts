/* ──────────────────────────────────────────
   결과 & 피드백 관련 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   ────────────────────────────────────────── */

import { Grade } from "@/types/user";

/** 3축 평가 점수 (BE에 개별 필드 없음, feedback 텍스트에서 파싱 or BE 추가 필요) */
export interface EvaluationScores {
  vocabulary: number;   // 어휘 점수 (0~10)
  situation: number;    // 상황 대처 점수 (0~10)
  grammar: number;      // 문법 점수 (0~10)
}

/** 결과 화면 데이터 */
// BE: { session_id, total_score_10, grade, llm_summary }
export interface ResultData {
  sessionId: string;         // BE: session_id
  totalScore10: number;      // BE: total_score_10 — 총점 (0~10, 가중평균)
  grade: Grade;              // BE: grade
  scores: EvaluationScores;  // FE 전용 (BE 미제공)
  llmSummary: string;        // BE: llm_summary — 한 줄 요약
}

/** 피드백 - 오답 단어 (BE에 별도 필드 없음, feedback 텍스트에서 파싱 필요) */
export interface WrongWord {
  original: string;     // 사용자가 쓴 표현
  corrected: string;    // 올바른 표현
  meaning: string;      // 뜻풀이
}

/** 피드백 - 대화 로그 (하이라이트 포함) */
// BE highlighted_log: { speaker, text, highlight }
export interface FeedbackMessage {
  speaker: "user" | "ai";
  utterance: string;
  hasError: boolean;           // BE: has_error
  errorHighlights?: string[]; // BE: error_highlights
}

/** 피드백 화면 데이터 */
// BE: { session_id, conversation_log, highlighted_log, total_score_10, grade, feedback, llm_summary }
export interface FeedbackData {
  sessionId: string;         // BE: session_id
  messages: FeedbackMessage[];
  wrongWords: WrongWord[];   // FE 전용 (BE 미제공) — BE: wrong_words
  feedback: string;          // BE: feedback — 전체 피드백 텍스트
  scores: EvaluationScores;  // FE 전용 (BE 미제공)
  totalScore10: number;      // BE: total_score_10
}
