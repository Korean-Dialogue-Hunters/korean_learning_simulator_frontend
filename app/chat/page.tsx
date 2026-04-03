"use client";

/* ──────────────────────────────────────────
   채팅 페이지 (/chat) — TODO #33~#39
   - 상단: 내 페르소나(미션) 카드 + 남은 턴 수
   - 중앙: 말풍선형 채팅 메시지 (스크롤)
   - 하단: 메시지 입력창 + 전송 버튼
   - 사용자가 선택한 페르소나 역할을 맡아 AI 상대방과 대화
   - 대화 종료 시 /result로 자동 이동

   ⚡ BE API 연동 전 mock 응답 사용 중
   🔗 연동: POST /conversation/turn
   ────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Persona } from "@/types/api";
import { useChat } from "@/hooks/useChat";
import PersonaProfileCard, { CounterpartInfo } from "@/components/chat/PersonaProfileCard";
import ChatBubble from "@/components/chat/ChatBubble";
import StreamingBubble, { TypingIndicator } from "@/components/chat/StreamingBubble";
import ChatInput from "@/components/chat/ChatInput";

/* ── Fallback (sessionStorage가 비었을 때) ── */
const FALLBACK_PERSONA: Persona = {
  id: "A",
  name: "김민준",
  age: 23,
  gender: "남성",
  role: "대학생",
  mission: "한강 자전거길을 달리다 길을 잃어 도움을 요청하는 대학생",
};
const FALLBACK_COUNTERPART: CounterpartInfo = {
  name: "이서연",
  age: 28,
  role: "직장인",
};

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* sessionStorage에서 내 역할 + 상대방 읽기 */
  const [persona, setPersona] = useState<Persona>(FALLBACK_PERSONA);
  const [counterpart, setCounterpart] = useState<CounterpartInfo>(FALLBACK_COUNTERPART);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("myPersona");
      if (saved) setPersona(JSON.parse(saved));
      const savedCounter = sessionStorage.getItem("counterpart");
      if (savedCounter) setCounterpart(JSON.parse(savedCounter));
    } catch { /* fallback 사용 */ }
  }, []);

  const {
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
  } = useChat(persona);

  /* 시나리오 타이틀 (BE 메타데이터 연동 시 sessionStorage에서 읽기) */
  const scenarioTitle: string | null = null; // TODO: sessionStorage.getItem("scenarioTitle")

  /* 한글 미포함 경고 메시지 */
  const [koreanWarning, setKoreanWarning] = useState(false);
  const handleKoreanError = () => {
    setKoreanWarning(true);
    setTimeout(() => setKoreanWarning(false), 3000);
  };

  /* 메시지 추가 시 자동 스크롤 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping, streamingText]);

  /* 대화 종료 시 대화 기록 저장 */
  useEffect(() => {
    if (isFinished) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [isFinished, messages]);

  return (
    <div className="flex flex-col h-screen pb-16" style={{ backgroundColor: "var(--color-background)" }}>
      {/* ── 상단 헤더 ── */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        {/* 뒤로가기 */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-tab-inactive hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span>나가기</span>
        </button>

        {/* 페르소나 프로필 + 남은 턴 (#34, #38) */}
        <PersonaProfileCard
          persona={persona}
          counterpart={counterpart}
          turnsLeft={turnsLeft}
          totalTurns={totalTurns}
          scenarioTitle={scenarioTitle}
        />
      </div>

      {/* ── 채팅 메시지 영역 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 미션 안내 */}
        {messages.length === 0 && !isAiTyping && (
          <div className="text-center py-8">
            <p className="text-sm text-tab-inactive">
              미션을 해결해보세요! 💬
            </p>
          </div>
        )}

        {/* 메시지 목록 (#35) */}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            personaName={msg.speaker === "ai" ? counterpart.name : undefined}
          />
        ))}

        {/* AI 타이핑 인디케이터 */}
        {isAiTyping && !streamingText && (
          <TypingIndicator personaName={counterpart.name} />
        )}

        {/* AI 응답 스트리밍 (#37) */}
        {streamingText && (
          <StreamingBubble
            text={streamingText}
            personaName={counterpart.name}
            onComplete={onStreamComplete}
          />
        )}

        {/* 대화 종료 안내 + 결과 확인 버튼 */}
        {isFinished && (
          <div className="text-center py-6 space-y-4">
            <p className="text-base font-bold text-foreground">
              대화가 끝났어요! 결과를 확인하러 가볼까요?
            </p>
            <button
              type="button"
              onClick={() => router.push("/result")}
              className="px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-btn-primary-text)",
              }}
            >
              결과 확인하기
            </button>
          </div>
        )}

        {/* 자동 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 결과 분석 버튼 (입력창 위, 좌하단) ── */}
      {!isFinished && (
        <div className="px-4 pb-1">
          <button
            type="button"
            onClick={requestAnalysis}
            disabled={usedTurns < 4}
            className="text-[14px] font-medium px-4 py-2 rounded-full transition-all active:scale-95"
            style={{
              backgroundColor: usedTurns >= 4
                ? "var(--color-accent)"
                : "var(--color-surface)",
              color: usedTurns >= 4
                ? "var(--color-btn-primary-text)"
                : "var(--color-tab-inactive)",
              cursor: usedTurns >= 4 ? "pointer" : "not-allowed",
            }}
          >
            결과 분석
          </button>
          <p className="text-[13px] text-tab-inactive mt-1">
            최소 4턴 이후 분석을 요청할 수 있어요
          </p>
        </div>
      )}

      {/* 한글 미포함 경고 */}
      {koreanWarning && (
        <div className="px-4 pb-1">
          <p className="text-[13px] text-tab-inactive text-center">
            한글을 사용해 문장을 완성해주세요!
            <br />
            Let&apos;s try to use Korean in the sentences!
          </p>
        </div>
      )}

      {/* ── 하단 입력창 (#36) ── */}
      <ChatInput
        onSend={sendMessage}
        disabled={isFinished}
        sendDisabled={isAiTyping}
        placeholder={isFinished ? "대화가 종료되었습니다" : "메시지를 입력하세요..."}
        onKoreanError={handleKoreanError}
      />
    </div>
  );
}
