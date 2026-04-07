"use client";

import { BookOpen, MessageSquare, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { KoreanLevel } from "@/types/setup";
import { warmCardStyle, warmIconContainerStyle, WARM_THEME } from "@/lib/designSystem";

interface LevelSelectProps {
  value: KoreanLevel | "";
  onChange: (level: KoreanLevel) => void;
}

export default function LevelSelect({ value, onChange }: LevelSelectProps) {
  const { t } = useTranslation();

  const LEVEL_OPTIONS: { value: KoreanLevel; descKey: string; turnsKey: string; icon: React.ReactNode }[] = [
    { value: "초급", descKey: "level.beginnerDesc", turnsKey: "level.beginnerTurns", icon: <BookOpen size={22} strokeWidth={1.8} /> },
    { value: "중급", descKey: "level.intermediateDesc", turnsKey: "level.intermediateTurns", icon: <MessageSquare size={22} strokeWidth={1.8} /> },
    { value: "고급", descKey: "level.advancedDesc", turnsKey: "level.advancedTurns", icon: <GraduationCap size={22} strokeWidth={1.8} /> },
  ];

  const LEVEL_LABELS: Record<KoreanLevel, string> = {
    초급: t("level.beginner"),
    중급: t("level.intermediate"),
    고급: t("level.advanced"),
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {LEVEL_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className="w-full rounded-2xl px-5 py-4 text-left transition-all flex items-center gap-4"
            style={warmCardStyle(isSelected)}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={warmIconContainerStyle(isSelected)}>
              {opt.icon}
            </div>
            <div>
              <span className="font-semibold text-[15px] block" style={{ color: WARM_THEME.text }}>
                {LEVEL_LABELS[opt.value]}
              </span>
              <span className="text-xs mt-0.5 block" style={{ color: WARM_THEME.textSub }}>
                {t(opt.descKey)}
              </span>
              <span className="text-[10px] mt-1 block font-medium" style={{ color: WARM_THEME.textSub, opacity: 0.8 }}>
                {t(opt.turnsKey)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
