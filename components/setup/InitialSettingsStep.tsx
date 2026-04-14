"use client";

/* ──────────────────────────────────────────
   셋업 1단계 — 초기 설정 (언어 + 테마)
   - 한/영 선택, 다크/라이트 선택
   - 선택 즉시 i18n + theme 클래스 적용
   ────────────────────────────────────────── */

import { useTranslation } from "react-i18next";
import { Globe, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { WARM_THEME, warmCardStyle } from "@/lib/designSystem";

export default function InitialSettingsStep() {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  const currentLang = i18n.language?.startsWith("ko") ? "ko" : "en";
  const setLang = (code: "ko" | "en") => {
    if (currentLang !== code) i18n.changeLanguage(code);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 언어 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} strokeWidth={2} style={{ color: WARM_THEME.textSub }} />
          <span className="text-sm font-bold" style={{ color: WARM_THEME.text }}>{t("settings.language")}</span>
        </div>
        <div className="flex gap-3">
          {(["ko", "en"] as const).map((code) => {
            const active = currentLang === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className="flex-1 rounded-2xl px-4 py-4 text-sm font-bold transition-all"
                style={warmCardStyle(active)}
              >
                {t(`language.${code}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 테마 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {isDark
            ? <Moon size={16} strokeWidth={2} style={{ color: WARM_THEME.textSub }} />
            : <Sun size={16} strokeWidth={2} style={{ color: WARM_THEME.textSub }} />}
          <span className="text-sm font-bold" style={{ color: WARM_THEME.text }}>{t("settings.theme")}</span>
        </div>
        <div className="flex gap-3">
          {([
            { code: "light", label: t("settings.themeLight"), icon: <Sun size={20} strokeWidth={2} /> },
            { code: "dark", label: t("settings.themeDark"), icon: <Moon size={20} strokeWidth={2} /> },
          ] as const).map((opt) => {
            const active = (opt.code === "dark") === isDark;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => { if (!active) toggleTheme(); }}
                className="flex-1 rounded-2xl px-4 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={warmCardStyle(active)}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
