"use client";

import { Globe, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="mb-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: WARM_THEME.accentLight }}
        >
          <MessageCircle size={36} strokeWidth={1.8} style={{ color: WARM_THEME.accent }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: WARM_THEME.text }}>
          코대헌
        </h1>
        <p className="text-sm mt-1" style={{ color: WARM_THEME.textSub }}>
          {t("welcome.subtitle")}
        </p>
      </div>

      <p
        className="text-base leading-relaxed mt-6 mb-10 max-w-[280px] whitespace-pre-line"
        style={{ color: WARM_THEME.text }}
      >
        {t("welcome.description")}
      </p>

      <div className="flex flex-col gap-4 w-full max-w-[300px] mb-12">
        <FeatureRow icon={<Globe size={20} strokeWidth={1.8} />} text={t("welcome.feature1")} />
        <FeatureRow icon={<MessageCircle size={20} strokeWidth={1.8} />} text={t("welcome.feature2")} />
        <FeatureRow icon={<Sparkles size={20} strokeWidth={1.8} />} text={t("welcome.feature3")} />
      </div>

      <button
        type="button"
        onClick={onStart}
        className={`w-full max-w-[300px] ${COMMON_CLASSES.fullWidthBtn} text-white`}
        style={{ backgroundColor: WARM_THEME.accent }}
      >
        {t("welcome.startBtn")}
      </button>

      <p className="text-xs mt-4" style={{ color: WARM_THEME.textSub }}>
        {t("welcome.timeNote")}
      </p>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: WARM_THEME.accentLight, color: WARM_THEME.accent }}
      >
        {icon}
      </div>
      <span className="text-sm font-medium" style={{ color: WARM_THEME.text }}>
        {text}
      </span>
    </div>
  );
}
