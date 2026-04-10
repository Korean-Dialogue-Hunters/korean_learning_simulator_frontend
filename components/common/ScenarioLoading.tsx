"use client";

/* ──────────────────────────────────────────
   시나리오 생성 로딩 오버레이
   - 풀스크린, 정중앙 스피너 + 메시지
   ────────────────────────────────────────── */

import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export default function ScenarioLoading() {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          size={40}
          strokeWidth={2}
          className="animate-spin"
          style={{ color: "var(--color-accent)" }}
        />
        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          {t("location.creating")}
        </p>
      </div>
    </div>
  );
}
