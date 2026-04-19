"use client";

import Image from "next/image";
import { Globe, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WARM_THEME, COMMON_CLASSES } from "@/lib/designSystem";
import { useLogoSrc } from "@/hooks/useLogoSrc";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const logoSrc = useLogoSrc();
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-8 text-center">
      <div className="mb-4 flex flex-col items-center">
        <Image
          src={logoSrc}
          alt="Korean Dialogue Hunters"
          width={280}
          height={186}
          priority
          className="mb-2 h-auto w-[240px]"
        />
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
