"use client";

/* ──────────────────────────────────────────
   말풍선형 채팅 메시지 컴포넌트
   - 내 메시지(페르소나 역할): 우측 정렬, 액센트 배경
   - 상대방 메시지: 좌측 정렬, 카드 배경
   - TODO #35
   ────────────────────────────────────────── */

import { ChatMessage } from "@/types/chat";

interface ChatBubbleProps {
  message: ChatMessage;
  personaName?: string;
}

export default function ChatBubble({ message, personaName }: ChatBubbleProps) {
  const isUser = message.speaker === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* 발신자 이름 (상대방만 표시) */}
        {!isUser && personaName && (
          <p
            className="text-[11px] font-medium mb-1 ml-1"
            style={{ color: "var(--color-tab-inactive)" }}
          >
            {personaName}
          </p>
        )}

        {/* 말풍선 */}
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={{
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            backgroundColor: isUser
              ? "var(--color-accent)"
              : "var(--color-card-bg)",
            color: isUser ? "var(--color-btn-primary-text)" : "var(--color-foreground)",
            border: isUser ? "none" : "1px solid var(--color-card-border)",
          }}
        >
          {message.utterance}
        </div>
      </div>
    </div>
  );
}
