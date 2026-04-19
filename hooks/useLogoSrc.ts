"use client";

import { useTheme } from "./useTheme";
import { useTranslation } from "react-i18next";

export function useLogoSrc() {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const theme = isDark ? "dark" : "light";
  const lang = i18n.language === "ko" ? "ko" : "en";
  return `/brand/kdh_logo_${theme}_${lang}.png`;
}
