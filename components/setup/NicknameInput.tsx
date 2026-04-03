"use client";

/* ──────────────────────────────────────────
   NicknameInput 컴포넌트
   - 닉네임 입력 (미리보기 + 실시간 편집)
   - 빈 입력란에 랜덤 추천 닉네임 옅은 글씨로 표시
   - 32바이트 초과 시 실시간 경고
   - 입력란 우측에 #6자리코드 항상 표시
   ────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { User, RefreshCw, Dices } from "lucide-react";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";
import {
  generateRandomNickname,
  validateNickname,
  getByteLength,
  MAX_NICKNAME_BYTES,
} from "@/lib/nicknameGenerator";

interface NicknameInputProps {
  value: string;
  onChange: (nickname: string) => void;
}

export default function NicknameInput({ value, onChange }: NicknameInputProps) {
  const [placeholder, setPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // 초기 랜덤 추천 닉네임 생성
  useEffect(() => {
    setPlaceholder(generateRandomNickname());
  }, []);

  // 추천 닉네임 새로고침
  const refreshPlaceholder = useCallback(() => {
    setPlaceholder(generateRandomNickname());
  }, []);

  // 추천 닉네임 클릭 시 입력란에 적용
  const applyPlaceholder = () => {
    if (!value && placeholder) {
      onChange(placeholder);
    }
  };

  const byteCount = getByteLength(value || "");
  const isOverLimit = byteCount > MAX_NICKNAME_BYTES;

  return (
    <div className="space-y-4">
      {/* 닉네임 입력 카드 */}
      <div
        className={`${COMMON_CLASSES.cardRounded} p-4 transition-all`}
        style={{
          backgroundColor: WARM_THEME.card,
          border: `1.5px solid ${isFocused ? WARM_THEME.accent : WARM_THEME.cardBorder}`,
          boxShadow: isFocused
            ? `0 0 0 3px ${WARM_THEME.accentLight}`
            : "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: WARM_THEME.accentLight,
              color: WARM_THEME.accent,
            }}
          >
            <User size={20} strokeWidth={1.8} />
          </div>

          <div className="flex-1 min-w-0">
            {/* 입력 */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder || "닉네임을 입력하세요"}
                className="flex-1 min-w-0 bg-transparent text-base font-medium outline-none placeholder:font-normal"
                style={{
                  color: WARM_THEME.text,
                  caretColor: WARM_THEME.accent,
                }}
              />
            </div>
            {/* 바이트 카운터 */}
            <div className="flex items-center justify-between mt-1">
              <span
                className="text-xs"
                style={{ color: isOverLimit ? "#E25555" : WARM_THEME.textSub }}
              >
                {byteCount} / {MAX_NICKNAME_BYTES} 바이트
              </span>
              {isOverLimit && (
                <span className="text-xs" style={{ color: "#E25555" }}>
                  너무 길어요!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 랜덤 생성 버튼 */}
      <button
        type="button"
        onClick={() => {
          const newNickname = generateRandomNickname();
          onChange(newNickname);
          refreshPlaceholder();
        }}
        className={`${COMMON_CLASSES.cardRounded} w-full p-3 flex items-center justify-center gap-2 transition-all active:scale-[0.97]`}
        style={{
          backgroundColor: WARM_THEME.accent,
          color: "#FFFFFF",
        }}
      >
        <Dices size={18} strokeWidth={2} />
        <span className="text-sm font-bold">랜덤 닉네임 생성</span>
      </button>

      {/* 추천 닉네임 미리보기 (빈 입력란일 때) */}
      {!value && (
        <div
          className={`${COMMON_CLASSES.cardRounded} p-3 flex items-center justify-between`}
          style={{
            backgroundColor: WARM_THEME.accentLight,
            border: `1px dashed ${WARM_THEME.accent}`,
          }}
        >
          <button
            type="button"
            onClick={applyPlaceholder}
            className="flex-1 text-left text-sm transition-opacity hover:opacity-80"
            style={{ color: WARM_THEME.accent }}
          >
            <span className="font-medium">추천:</span>{" "}
            <span className="font-bold">{placeholder}</span>
            <span className="text-xs ml-1 opacity-70">탭하여 사용</span>
          </button>
          <button
            type="button"
            onClick={refreshPlaceholder}
            className="ml-2 p-1.5 rounded-lg transition-all hover:opacity-70 active:scale-90"
            style={{ color: WARM_THEME.accent }}
            aria-label="추천 닉네임 새로고침"
          >
            <RefreshCw size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
