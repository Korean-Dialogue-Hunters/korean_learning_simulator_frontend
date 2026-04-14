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

  const LEVEL_OPTIONS: {
    value: KoreanLevel;
    tagKey: string;
    descKey: string;
    turnsKey: string;
    icon: React.ReactNode;
    disabled: boolean;
  }[] = [
    { value: "초급", tagKey: "level.beginnerTag", descKey: "level.beginnerDesc", turnsKey: "level.beginnerTurns", icon: <BookOpen size={26} strokeWidth={1.8} />, disabled: false },
    { value: "중급", tagKey: "level.intermediateTag", descKey: "level.intermediateDesc", turnsKey: "level.intermediateTurns", icon: <MessageSquare size={26} strokeWidth={1.8} />, disabled: true },
    { value: "고급", tagKey: "level.advancedTag", descKey: "level.advancedDesc", turnsKey: "level.advancedTurns", icon: <GraduationCap size={26} strokeWidth={1.8} />, disabled: true },
  ];

  const LEVEL_LABELS: Record<KoreanLevel, string> = {
    초급: t("level.beginner"),
    중급: t("level.intermediate"),
    고급: t("level.advanced"),
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {LEVEL_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className="w-full rounded-2xl px-5 py-5 text-left transition-all flex items-center gap-4 relative"
            style={{ ...warmCardStyle(isSelected), opacity: opt.disabled ? 0.5 : 1, cursor: opt.disabled ? "not-allowed" : "pointer" }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={warmIconContainerStyle(isSelected)}>
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="font-bold text-[17px]" style={{ color: WARM_THEME.text }}>
                  {LEVEL_LABELS[opt.value]}
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ color: WARM_THEME.textSub, border: `1px solid ${WARM_THEME.textSub}`, opacity: 0.9 }}>
                  {t(opt.tagKey)}
                </span>
              </div>
              <span className="text-[13px] block leading-snug" style={{ color: WARM_THEME.textSub }}>
                {t(opt.descKey)}
              </span>
              <span className="text-[12px] mt-1.5 block font-medium" style={{ color: WARM_THEME.textSub, opacity: 0.75 }}>
                {t(opt.turnsKey)}
              </span>
            </div>
            {opt.disabled && (
              <span className="absolute bottom-2 right-3 text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: WARM_THEME.textSub, backgroundColor: "rgba(0,0,0,0.05)" }}>
                {t("level.comingSoon")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
