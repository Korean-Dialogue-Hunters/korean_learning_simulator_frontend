"use client";

/* ──────────────────────────────────────────
   CultureSelect 컴포넌트 (따뜻한 무드 리디자인)
   - 관심 있는 한국 문화 중복 선택 가능
   - Others 선택 시 텍스트 입력 필드 표시
   - 선택된 항목들을 string[]로 전달
   ────────────────────────────────────────── */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Clapperboard, Music, Sparkles, UtensilsCrossed, Gamepad2, Heart, Check } from "lucide-react";
import { CulturalInterestOption } from "@/types/setup";
import { warmCardStyle, WARM_THEME } from "@/lib/designSystem";

interface CultureSelectProps {
  value: string[];
  onChange: (interests: string[]) => void;
}

/* 고정 선택지 목록 */
const CULTURE_OPTIONS: {
  value: CulturalInterestOption;
  icon: React.ReactNode;
}[] = [
  { value: "K-Content", icon: <Clapperboard size={24} strokeWidth={1.6} /> },
  { value: "K-Pop", icon: <Music size={24} strokeWidth={1.6} /> },
  { value: "K-Beauty", icon: <Sparkles size={24} strokeWidth={1.6} /> },
  { value: "K-Food", icon: <UtensilsCrossed size={24} strokeWidth={1.6} /> },
  { value: "K-Gaming·eSports", icon: <Gamepad2 size={24} strokeWidth={1.6} /> },
  { value: "Others", icon: <Heart size={24} strokeWidth={1.6} /> },
];

/* 고정 선택지 값 목록 (Others 텍스트와 구분용) */
const FIXED_OPTIONS = CULTURE_OPTIONS.map((o) => o.value as string);

export default function CultureSelect({ value, onChange }: CultureSelectProps) {
  const { t } = useTranslation();
  /* Others 직접 입력 텍스트 상태 */
  const [othersText, setOthersText] = useState(() => {
    // 기존 value에서 고정 옵션이 아닌 항목 = Others 텍스트
    const custom = value.find((v) => !FIXED_OPTIONS.includes(v));
    return custom ?? "";
  });

  /* Others가 선택되어 있는지 */
  const isOthersActive = value.includes("Others") || value.some((v) => !FIXED_OPTIONS.includes(v));

  /* 고정 옵션 토글 (중복 선택) */
  const toggleOption = (opt: CulturalInterestOption) => {
    if (opt === "Others") {
      // Others 토글
      if (isOthersActive) {
        // Others 해제: Others + 커스텀 텍스트 제거
        onChange(value.filter((v) => v !== "Others" && FIXED_OPTIONS.includes(v)));
        setOthersText("");
      } else {
        // Others 활성화
        onChange([...value, "Others"]);
      }
      return;
    }

    // 일반 옵션 토글
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  /* Others 텍스트 입력 변경 */
  const handleOthersTextChange = (text: string) => {
    setOthersText(text);
    // value에서 기존 커스텀 텍스트 제거 후 새 텍스트 추가
    const filtered = value.filter((v) => FIXED_OPTIONS.includes(v));
    if (text.trim()) {
      // Others 태그 유지 + 커스텀 텍스트 추가
      if (!filtered.includes("Others")) filtered.push("Others");
      onChange([...filtered, text.trim()]);
    } else {
      onChange(filtered);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* 선택지 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {CULTURE_OPTIONS.map((opt) => {
          const isSelected =
            opt.value === "Others"
              ? isOthersActive
              : value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className="rounded-2xl py-5 flex flex-col items-center gap-2.5 transition-all relative"
              style={warmCardStyle(isSelected)}
            >
              {/* 선택 체크 표시 */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: WARM_THEME.accent }}
                >
                  <Check size={12} strokeWidth={3} color="#FFFFFF" />
                </div>
              )}
              {/* 아이콘 */}
              <div
                style={{
                  color: isSelected ? WARM_THEME.accent : WARM_THEME.textSub,
                }}
              >
                {opt.icon}
              </div>
              {/* 라벨 */}
              <span
                className="text-xs font-medium"
                style={{
                  color: isSelected ? WARM_THEME.accent : WARM_THEME.text,
                }}
              >
                {opt.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Others 텍스트 입력 (Others 선택 시만 표시) */}
      {isOthersActive && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder={t("culture.othersPlaceholder")}
            value={othersText}
            onChange={(e) => handleOthersTextChange(e.target.value)}
            maxLength={50}
            className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
            style={{
              backgroundColor: WARM_THEME.card,
              border: `1.5px solid ${othersText ? WARM_THEME.accent : WARM_THEME.cardBorder}`,
              color: WARM_THEME.text,
              boxShadow: othersText ? `0 0 0 3px ${WARM_THEME.accentLight}` : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          />
          {/* 입력한 텍스트 미리보기 */}
          {othersText.trim() && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{
                backgroundColor: WARM_THEME.accentLight,
                color: WARM_THEME.accent,
              }}
            >
              <span className="font-medium">{t("culture.enteredInterest")}</span>
              <span>{othersText.trim()}</span>
            </div>
          )}
        </div>
      )}

      {/* 선택 현황 표시 */}
      {value.length > 0 && (
        <p className="text-[11px] text-right" style={{ color: WARM_THEME.textSub }}>
          {t("culture.selectedCount", { count: value.filter((v) => v !== "Others").length })}
        </p>
      )}
    </div>
  );
}
