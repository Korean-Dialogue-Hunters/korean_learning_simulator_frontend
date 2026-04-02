"use client";

/* ──────────────────────────────────────────
   메시지 입력창 + 전송 버튼
   - TODO #36
   ────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { WARM_THEME } from "@/lib/designSystem";
import { getByteLength } from "@/lib/nicknameGenerator";

const MAX_INPUT_BYTES = 1000;
const MAX_LINES = 6;
const LINE_HEIGHT = 20; // leading-relaxed 기준 약 20px
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES; // 6줄 = 120px

/** 한글 포함 여부 체크 (자음/모음/완성형 모두) */
const containsKorean = (text: string) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  /** true면 입력은 가능하지만 전송만 막힘 */
  sendDisabled?: boolean;
  placeholder?: string;
  /** 한글 미포함 메시지 전송 시도 시 호출 */
  onKoreanError?: () => void;
}

export default function ChatInput({
  onSend,
  disabled = false,
  sendDisabled = false,
  placeholder = "메시지를 입력하세요...",
  onKoreanError,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* 높이 자동 조절 (최대 6줄, 스크롤 없음) */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + "px";
  }, [text]);

  const byteLength = getByteLength(text);
  const isOverLimit = byteLength > MAX_INPUT_BYTES;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    /* 2000바이트 초과 시 입력 차단 */
    if (getByteLength(newText) > MAX_INPUT_BYTES) return;
    setText(newText);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || sendDisabled || isOverLimit) return;
    /* 한글이 하나도 없으면 전송 차단 + 입력 초기화 */
    if (!containsKorean(trimmed)) {
      setText("");
      onKoreanError?.();
      return;
    }
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    /* Enter로 전송, Shift+Enter로 줄바꿈 */
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !disabled && !sendDisabled;

  return (
    <div
      className="flex items-end gap-2 px-4 py-3"
      style={{
        backgroundColor: "var(--color-background)",
        borderTop: "1px solid var(--color-card-border)",
      }}
    >
      {/* 입력창 */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none text-sm leading-relaxed py-2.5 px-4 rounded-2xl outline-none placeholder:text-tab-inactive overflow-hidden"
        style={{
          backgroundColor: "var(--color-card-bg)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-card-border)",
          maxHeight: MAX_HEIGHT,
        }}
      />

      {/* 전송 버튼 */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className="w-10 h-10 rounded-full grid place-items-center shrink-0 transition-all active:scale-90"
        style={{
          backgroundColor: canSend ? "var(--color-accent)" : "var(--color-surface)",
          color: canSend ? "var(--color-btn-primary-text)" : "var(--color-tab-inactive)",
        }}
      >
        <Send size={18} strokeWidth={2} className="-translate-x-[1px]" />
      </button>
    </div>
  );
}
