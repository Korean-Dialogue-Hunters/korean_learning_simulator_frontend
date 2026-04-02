"use client";

/* ──────────────────────────────────────────
   useChat 커스텀 훅
   - 채팅 메시지 상태 관리
   - AI 응답 mock (BE 연동 전)
   - 턴 카운트 & 종료 감지
   ────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { Persona } from "@/types/api";

const TOTAL_TURNS = 7;

/* ── Mock 상대방 응답 (BE 연동 시 POST /conversation/turn 으로 교체) ── */
const MOCK_REPLIES = [
  "안녕하세요! 한강에 오셨군요. 날씨가 정말 좋네요!",
  "네, 저도 오늘 처음 와봤어요. 여기 자전거 빌릴 수 있나요?",
  "아, 저기 편의점 옆에 자전거 대여소가 있어요! 같이 가볼까요?",
  "좋아요! 그런데 혹시 이 근처에 맛있는 곳 아세요?",
  "여의도 쪽으로 가면 유명한 치킨집이 있어요. 한강 치킨은 꼭 먹어봐야 해요!",
  "와, 진짜요? 치킨이랑 맥주... 완벽한 조합이네요!",
  "오늘 정말 즐거웠어요. 다음에 또 만나요!",
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useChat(persona: Persona) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turnsLeft, setTurnsLeft] = useState(TOTAL_TURNS);
  const [isFinished, setIsFinished] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  /* 사용자 메시지 전송 → AI 응답 */
  const sendMessage = useCallback(
    (text: string) => {
      if (isFinished || isAiTyping) return;

      /* 사용자 메시지 추가 */
      const userMsg: ChatMessage = {
        id: generateId(),
        speaker: "user",
        utterance: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      /* 상대방 응답 시뮬레이션 */
      setIsAiTyping(true);
      const replyIndex = TOTAL_TURNS - turnsLeft;
      const replyText =
        MOCK_REPLIES[replyIndex % MOCK_REPLIES.length];

      /* 응답 지연 시뮬레이션 (0.8~1.5초) */
      const delay = 800 + Math.random() * 700;
      setTimeout(() => {
        setStreamingText(replyText);
      }, delay);
    },
    [isFinished, isAiTyping, turnsLeft],
  );

  /* 스트리밍 완료 콜백 */
  const onStreamComplete = useCallback(() => {
    const aiMsg: ChatMessage = {
      id: generateId(),
      speaker: "ai",
      utterance: streamingText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setStreamingText("");
    setIsAiTyping(false);

    const newTurnsLeft = turnsLeft - 1;
    setTurnsLeft(newTurnsLeft);
    if (newTurnsLeft <= 0) {
      setIsFinished(true);
    }
  }, [streamingText, turnsLeft]);

  const usedTurns = TOTAL_TURNS - turnsLeft;

  /* 조기 분석 요청 (최소 4턴 이후) */
  const requestAnalysis = useCallback(() => {
    if (usedTurns < 4) return;
    setIsFinished(true);
  }, [usedTurns]);

  return {
    messages,
    turnsLeft,
    totalTurns: TOTAL_TURNS,
    usedTurns,
    isFinished,
    isAiTyping,
    streamingText,
    sendMessage,
    onStreamComplete,
    requestAnalysis,
  };
}
