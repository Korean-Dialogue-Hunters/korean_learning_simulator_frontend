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
import { createTurn, getSession } from "@/lib/api";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useChat(persona: Persona) {
  /* turnLimit: localStorage에서 읽기 (BE 응답값), 기본 7 */
  const [totalTurns] = useState(() => {
    if (typeof window === "undefined") return 7;
    const saved = localStorage.getItem("turnLimit");
    return saved ? parseInt(saved, 10) : 7;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turnsLeft, setTurnsLeft] = useState(totalTurns);
  const [isFinished, setIsFinished] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  /* 세션 초기화: 새 세션이면 firstAiMessage, 재진입이면 BE에서 대화 로그 복원 */
  useEffect(() => {
    const firstMsg = localStorage.getItem("firstAiMessage");
    if (firstMsg) {
      /* 새 세션 — AI 첫 발화만 표시 */
      const aiMsg: ChatMessage = {
        id: generateId(),
        speaker: "ai",
        utterance: firstMsg,
        timestamp: Date.now(),
      };
      setMessages([aiMsg]);
      localStorage.removeItem("firstAiMessage");
      return;
    }

    /* 재진입 — BE에서 대화 로그 + 턴 상태 복원 */
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) return;

    getSession(sessionId)
      .then((res) => {
        if (res.conversationLog && res.conversationLog.length > 0) {
          const restored: ChatMessage[] = res.conversationLog.map((entry) => ({
            id: generateId(),
            speaker: entry.speaker as "user" | "ai",
            utterance: entry.utterance,
            timestamp: Date.now(),
          }));
          setMessages(restored);
          const newTurnsLeft = totalTurns - res.turnCount;
          setTurnsLeft(newTurnsLeft);
          if (res.isFinished) {
            setIsFinished(true);
          }
        }
      })
      .catch(() => { /* 복원 실패 시 빈 채팅으로 시작 */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 사용자 메시지 전송 → BE API 호출 → AI 응답 수신 */
  const sendMessage = useCallback(
    async (text: string) => {
      if (isFinished || isAiTyping) return;

      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) return;

      /* 사용자 메시지 즉시 표시 */
      const userMsg: ChatMessage = {
        id: generateId(),
        speaker: "user",
        utterance: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setTurnsLeft((prev) => Math.max(prev - 1, 0));
      setIsAiTyping(true);

      try {
        /* POST /v1/sessions/{id}/turns — 턴 진행 */
        const res = await createTurn(sessionId, text);

        /* AI 응답을 스트리밍 텍스트에 세팅 (StreamingBubble이 처리) */
        setStreamingText(res.latestAiResponse);

        /* BE 턴 카운트로 보정 (BE가 정확한 값) */
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
