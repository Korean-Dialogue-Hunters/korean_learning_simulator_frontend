"use client";

/* ──────────────────────────────────────────
   설정 페이지 (/settings)
   - 언어(한/영) + 테마(다크/라이트) 토글
   - 홈 우상단 톱니바퀴 또는 셋업 0단계에서 진입
   ────────────────────────────────────────── */

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Globe, Sun, Moon, Settings as SettingsIcon } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  const currentLang = i18n.language?.startsWith("ko") ? "ko" : "en";

  const setLang = (code: "ko" | "en") => {
    if (currentLang !== code) i18n.changeLanguage(code);
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("common.back")}</span>
      </button>

      <div className="flex items-center gap-2 mb-8">
        <SettingsIcon size={22} strokeWidth={2} className="text-accent" />
        <h1 className="text-xl font-bold text-foreground">{t("settings.title")}</h1>
      </div>

      {/* 언어 */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} strokeWidth={2} className="text-tab-inactive" />
          <p className="text-sm font-bold text-foreground">{t("settings.language")}</p>
        </div>
        <div className={`${COMMON_CLASSES.cardRounded} p-1 flex gap-1`}
          style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
          {(["ko", "en"] as const).map((code) => {
            const active = currentLang === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: active ? "var(--color-accent)" : "transparent",
                  color: active ? "var(--color-btn-primary-text)" : "var(--color-foreground)",
                }}
              >
                {t(`language.${code}`)}
              </button>
            );
          })}
        </div>
      </section>

      {/* 테마 */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {isDark ? <Moon size={16} strokeWidth={2} className="text-tab-inactive" /> : <Sun size={16} strokeWidth={2} className="text-tab-inactive" />}
          <p className="text-sm font-bold text-foreground">{t("settings.theme")}</p>
        </div>
        <div className={`${COMMON_CLASSES.cardRounded} p-1 flex gap-1`}
          style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
          {([
            { code: "light", label: t("settings.themeLight"), icon: <Sun size={16} strokeWidth={2} /> },
            { code: "dark", label: t("settings.themeDark"), icon: <Moon size={16} strokeWidth={2} /> },
          ] as const).map((opt) => {
            const active = (opt.code === "dark") === isDark;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => { if (active) return; toggleTheme(); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: active ? "var(--color-accent)" : "transparent",
                  color: active ? "var(--color-btn-primary-text)" : "var(--color-foreground)",
                }}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
