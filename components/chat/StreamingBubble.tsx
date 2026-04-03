"use client";

/* ──────────────────────────────────────────
   상대방 응답 스트리밍 표시 컴포넌트
   - 글자가 순서대로 나타나는 효과
   - 스트리밍 중 점 애니메이션 표시
   - TODO #37
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";

interface StreamingBubbleProps {
  text: string;
  personaName: string;
  onComplete: () => void;
  speed?: number; // 글자당 ms (기본 40ms)
}

export default function StreamingBubble({
  text,
  personaName,
  onComplete,
  speed = 40,
}: StreamingBubbleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    setIsComplete(false);

    const timer = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        setIsComplete(true);
        onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[80%]">
        {/* 상대방 이름 */}
        <p
          className="text-[11px] font-medium mb-1 ml-1"
          style={{ color: "var(--color-tab-inactive)" }}
        >
          {personaName}
        </p>

        {/* 말풍선 */}
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={{
            borderRadius: "18px 18px 18px 4px",
            backgroundColor: "var(--color-card-bg)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          {displayedText}
          {/* 타이핑 커서 */}
          {!isComplete && (
            <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 로딩 점 애니메이션 (상대방 응답 대기 중) ── */
export function TypingIndicator({ personaName }: { personaName: string }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[80%]">
        <p
          className="text-[11px] font-medium mb-1 ml-1"
          style={{ color: "var(--color-tab-inactive)" }}
        >
          {personaName}
        </p>
        <div
          className="px-4 py-3 flex gap-1 items-center"
          style={{
            borderRadius: "18px 18px 18px 4px",
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: "var(--color-accent)",
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
