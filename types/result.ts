/* ──────────────────────────────────────────
   결과 & 피드백 관련 타입 정의
   - BE API 필드명 기준으로 통일
   ────────────────────────────────────────── */

import { Grade } from "@/types/user";

/** 3축 평가 점수 (BE에 개별 필드 없음, feedback 텍스트에서 파싱 or BE 추가 필요) */
export interface EvaluationScores {
  vocabulary: number;   // 어휘 점수 (0~10)
  situation: number;    // 상황 대처 점수 (0~10)
  grammar: number;      // 문법 점수 (0~10)
}

/** 결과 화면 데이터 */
export interface ResultData {
  session_id: string;
  total_score_10: number;  // 총점 (0~10, 가중평균)
  grade: Grade;
  scores: EvaluationScores;
  llm_summary: string;     // 한 줄 요약
}

/** 피드백 - 오답 단어 (BE에 별도 필드 없음, feedback 텍스트에서 파싱 필요) */
export interface WrongWord {
  original: string;     // 사용자가 쓴 표현
  corrected: string;    // 올바른 표현
  meaning: string;      // 뜻풀이
}

/** 피드백 - 대화 로그 (하이라이트 포함) */
export interface FeedbackMessage {
  speaker: "user" | "ai";
  utterance: string;
  has_error: boolean;
  error_highlights?: string[];
}

/** 피드백 화면 데이터 */
export interface FeedbackData {
  session_id: string;
  messages: FeedbackMessage[];
  wrong_words: WrongWord[];
  feedback: string;           // 전체 피드백 텍스트
  scores: EvaluationScores;
  total_score_10: number;
}
