"use client";

/* ──────────────────────────────────────────
   CultureSelect 컴포넌트 (따뜻한 무드 리디자인)
   - 관심 있는 한국 문화 1가지 선택
   - 2열 그리드 카드 스타일
   ────────────────────────────────────────── */

import { Clapperboard, Music, Sparkles, UtensilsCrossed, Gamepad2, Heart } from "lucide-react";
import { CulturalInterest } from "@/types/setup";
import { warmCardStyle, WARM_THEME } from "@/lib/designSystem";

interface CultureSelectProps {
  value: CulturalInterest | "";
  onChange: (interest: CulturalInterest) => void;
}

const CULTURE_OPTIONS: {
  value: CulturalInterest;
  icon: React.ReactNode;
}[] = [
  { value: "K-Content", icon: <Clapperboard size={24} strokeWidth={1.6} /> },
  { value: "K-Pop", icon: <Music size={24} strokeWidth={1.6} /> },
  { value: "K-Beauty", icon: <Sparkles size={24} strokeWidth={1.6} /> },
  { value: "K-Food", icon: <UtensilsCrossed size={24} strokeWidth={1.6} /> },
  { value: "K-Gaming·eSports", icon: <Gamepad2 size={24} strokeWidth={1.6} /> },
  { value: "Others", icon: <Heart size={24} strokeWidth={1.6} /> },
];

export default function CultureSelect({ value, onChange }: CultureSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {CULTURE_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="rounded-2xl py-5 flex flex-col items-center gap-2.5 transition-all"
            style={warmCardStyle(isSelected)}
          >
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
  );
}
