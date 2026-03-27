"use client";

/* ──────────────────────────────────────────
   LevelSelect 컴포넌트 (따뜻한 무드 리디자인)
   - 한국어 수준 선택: 초급 / 중급 / 고급
   - 카드 스타일 + 아이콘
   ────────────────────────────────────────── */

import { BookOpen, MessageSquare, GraduationCap } from "lucide-react";
import { KoreanLevel } from "@/types/setup";
import { warmCardStyle, warmIconContainerStyle, WARM_THEME } from "@/lib/designSystem";

interface LevelSelectProps {
  value: KoreanLevel | "";
  onChange: (level: KoreanLevel) => void;
}

const LEVEL_OPTIONS: {
  value: KoreanLevel;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "초급",
    desc: "안녕하세요, 감사합니다 정도",
    icon: <BookOpen size={22} strokeWidth={1.8} />,
  },
  {
    value: "중급",
    desc: "일상 대화가 가능한 수준",
    icon: <MessageSquare size={22} strokeWidth={1.8} />,
  },
  {
    value: "고급",
    desc: "자연스러운 표현 구사 가능",
    icon: <GraduationCap size={22} strokeWidth={1.8} />,
  },
];

export default function LevelSelect({ value, onChange }: LevelSelectProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {LEVEL_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="w-full rounded-2xl px-5 py-4 text-left transition-all flex items-center gap-4"
            style={warmCardStyle(isSelected)}
          >
            {/* 아이콘 */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={warmIconContainerStyle(isSelected)}
            >
              {opt.icon}
            </div>
            {/* 텍스트 */}
            <div>
              <span
                className="font-semibold text-[15px] block"
                style={{ color: WARM_THEME.text }}
              >
                {opt.value}
              </span>
              <span
                className="text-xs mt-0.5 block"
                style={{ color: WARM_THEME.textSub }}
              >
                {opt.desc}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
