/* ──────────────────────────────────────────
   결과 & 피드백 관련 타입 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   ────────────────────────────────────────── */

import { Grade } from "@/types/user";

/** 5축 평가 점수 (모두 0~10 스케일) */
export interface EvaluationScores {
  length: number;             // BE: length_score — 발화 길이 (0~10)
  vocabulary: number;         // BE: vocab_score — 어휘 다양성 (0~10)
  sceneMission: number;       // BE: context_scene_mission_match (0/2/4/6/8/10)
  relationship: number;       // BE: context_relationship_match (0/2/4/6/8/10)
  spelling: number;           // BE: spelling_score — 맞춤법 (0~10)
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

/** 피드백 - 대화 로그 */
export interface FeedbackMessage {
  speaker: "user" | "ai";
  utterance: string;
}

/** 피드백 화면 데이터 */
// BE: { session_id, conversation_log, highlighted_log, total_score_10, grade, feedback, llm_summary }
export interface FeedbackData {
  sessionId: string;         // BE: session_id
  messages: FeedbackMessage[];
  feedback: string;          // BE: feedback — 전체 피드백 텍스트
  scores: EvaluationScores;
  totalScore10: number;      // BE: total_score_10
}
