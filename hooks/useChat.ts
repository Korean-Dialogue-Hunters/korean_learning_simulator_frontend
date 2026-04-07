"use client";

/* ──────────────────────────────────────────
   useChat 커스텀 훅
   - 채팅 메시지 상태 관리
   - BE 연동: POST /v1/sessions/{id}/turns
   - 턴 카운트 & 종료 감지
   ────────────────────────────────────────── */

import { useState, useCallback, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { Persona } from "@/types/api";
import { createTurn } from "@/lib/api";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useChat(persona: Persona) {
  /* turnLimit: sessionStorage에서 읽기 (BE 응답값), 기본 7 */
  const [totalTurns] = useState(() => {
    if (typeof window === "undefined") return 7;
    const saved = sessionStorage.getItem("turnLimit");
    return saved ? parseInt(saved, 10) : 7;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turnsLeft, setTurnsLeft] = useState(totalTurns);
  const [isFinished, setIsFinished] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  /* AI 첫 발화 (역할 선택 시 BE가 보내준 것) */
  useEffect(() => {
    const firstMsg = sessionStorage.getItem("firstAiMessage");
    if (firstMsg) {
      const aiMsg: ChatMessage = {
        id: generateId(),
        speaker: "ai",
        utterance: firstMsg,
        timestamp: Date.now(),
      };
      setMessages([aiMsg]);
      sessionStorage.removeItem("firstAiMessage");
    }
  }, []);

  /* 사용자 메시지 전송 → BE API 호출 → AI 응답 수신 */
  const sendMessage = useCallback(
    async (text: string) => {
      if (isFinished || isAiTyping) return;

      const sessionId = sessionStorage.getItem("sessionId");
      if (!sessionId) return;

      /* 사용자 메시지 즉시 표시 */
      const userMsg: ChatMessage = {
        id: generateId(),
        speaker: "user",
        utterance: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsAiTyping(true);

      try {
        /* POST /v1/sessions/{id}/turns — 턴 진행 */
        const res = await createTurn(sessionId, text);

        /* AI 응답을 스트리밍 텍스트에 세팅 (StreamingBubble이 처리) */
        setStreamingText(res.latestAiResponse);

        /* 턴 카운트 업데이트 */
        const newTurnsLeft = totalTurns - res.turnCount;
        setTurnsLeft(newTurnsLeft);

        /* BE에서 종료 판단 */
        if (res.isFinished) {
          setIsFinished(true);
        }
      } catch (e) {
        /* 에러 시 AI 메시지로 에러 표시 */
        const errorMsg: ChatMessage = {
          id: generateId(),
          speaker: "ai",
          utterance: `⚠️ 오류가 발생했습니다: ${e instanceof Error ? e.message : "알 수 없는 오류"}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsAiTyping(false);
      }
    },
    [isFinished, isAiTyping, totalTurns],
  );

  /* 스트리밍 완료 콜백 (StreamingBubble 애니메이션 끝나면 호출) */
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
  }, [streamingText]);

  const usedTurns = totalTurns - turnsLeft;

  /* 조기 분석 요청 (최소 4턴 이후) */
  const requestAnalysis = useCallback(() => {
    if (usedTurns < 4) return;
    setIsFinished(true);
  }, [usedTurns]);

  return {
    messages,
    turnsLeft,
    totalTurns,
    usedTurns,
    isFinished,
    isAiTyping,
    streamingText,
    sendMessage,
    onStreamComplete,
    requestAnalysis,
  };
}
