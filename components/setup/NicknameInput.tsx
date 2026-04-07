"use client";

import { useState, useEffect, useCallback } from "react";
import { User, RefreshCw, Dices } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";
import { generateRandomNickname, getNicknameMeaning, getByteLength, MAX_NICKNAME_BYTES } from "@/lib/nicknameGenerator";

interface NicknameInputProps {
  value: string;
  onChange: (nickname: string) => void;
}

function ByteDonut({ used, max }: { used: number; max: number }) {
  const ratio = Math.min(used / max, 1);
  const isOver = used > max;
  const isWarning = used / max >= 0.8;
  const fillColor = isOver ? "#E25555" : isWarning ? "#E8A020" : WARM_THEME.accent;
  const trackColor = "var(--color-card-border)";
  return (
    <div className="shrink-0 rounded-full"
      style={{ width: 20, height: 20, background: `conic-gradient(${fillColor} ${ratio * 360}deg, ${trackColor} 0deg)`, transition: "background 0.15s" }} />
  );
}

export default function NicknameInput({ value, onChange }: NicknameInputProps) {
  const { t } = useTranslation();
  const [placeholder, setPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => { setPlaceholder(generateRandomNickname()); }, []);

  const refreshPlaceholder = useCallback(() => { setPlaceholder(generateRandomNickname()); }, []);

  const applyPlaceholder = () => { if (!value && placeholder) onChange(placeholder); };

  const byteCount = getByteLength(value || "");
  const isOverLimit = byteCount > MAX_NICKNAME_BYTES;

  // 현재 표시 중인 닉네임(입력값 or 추천값)의 영어 뜻
  const displayNickname = value || placeholder;
  const meaning = displayNickname ? getNicknameMeaning(displayNickname) : null;

  return (
    <div className="space-y-4">
      <div className={`${COMMON_CLASSES.cardRounded} p-4 transition-all`}
        style={{
          backgroundColor: WARM_THEME.card,
          border: `1.5px solid ${isFocused ? WARM_THEME.accent : isOverLimit ? "#E25555" : WARM_THEME.cardBorder}`,
          boxShadow: isFocused ? `0 0 0 3px ${WARM_THEME.accentLight}` : "0 1px 3px rgba(0,0,0,0.04)",
        }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: WARM_THEME.accentLight, color: WARM_THEME.accent }}>
            <User size={20} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <input
              type="text" value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || t("nickname.placeholder")}
              className="flex-1 min-w-0 bg-transparent text-base font-medium outline-none placeholder:font-normal"
              style={{ color: WARM_THEME.text, caretColor: WARM_THEME.accent }}
            />
            <ByteDonut used={byteCount} max={MAX_NICKNAME_BYTES} />
          </div>
        </div>
      </div>

      {/* 영어 뜻 안내 */}
      {meaning && (
        <p className="text-center text-sm" style={{ color: WARM_THEME.textSub }}>
          It means{" "}
          <span className="font-semibold" style={{ color: WARM_THEME.accent }}>
            &ldquo;{meaning}&rdquo;
          </span>{" "}
          in Korean!
        </p>
      )}

      <button type="button"
        onClick={() => { const n = generateRandomNickname(); onChange(n); refreshPlaceholder(); }}
        className={`${COMMON_CLASSES.cardRounded} w-full p-3 flex items-center justify-center gap-2 transition-all active:scale-[0.97]`}
        style={{ backgroundColor: WARM_THEME.accent, color: "#FFFFFF" }}>
        <Dices size={18} strokeWidth={2} />
        <span className="text-sm font-bold">{t("nickname.randomBtn")}</span>
      </button>

      {!value && (
        <div className={`${COMMON_CLASSES.cardRounded} p-3 flex items-center justify-between`}
          style={{ backgroundColor: WARM_THEME.accentLight, border: `1px dashed ${WARM_THEME.accent}` }}>
          <button type="button" onClick={applyPlaceholder}
            className="flex-1 text-left text-sm transition-opacity hover:opacity-80"
            style={{ color: WARM_THEME.accent }}>
            <span className="font-medium">{t("nickname.recommended")}</span>{" "}
            <span className="font-bold">{placeholder}</span>
            <span className="text-xs ml-1 opacity-70">{t("nickname.tapToUse")}</span>
          </button>
          <button type="button" onClick={refreshPlaceholder}
            className="ml-2 p-1.5 rounded-lg transition-all hover:opacity-70 active:scale-90"
            style={{ color: WARM_THEME.accent }} aria-label="refresh">
            <RefreshCw size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
