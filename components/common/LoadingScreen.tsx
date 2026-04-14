"use client";

/* ──────────────────────────────────────────
   공통 로딩 화면 (T4-01)
   - variant: scenario / evaluation / review
   - 브랜드 스피너 + 단계별 메시지 회전
   - 깜빡임 방지: active=true 후 delayMs 지나야 표시,
     일단 표시되면 minVisibleMs 보장 후에만 사라짐
   - 사용법: <LoadingScreen active={loading} variant="..." />
   ────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

type Variant = "scenario" | "evaluation" | "review";

interface LoadingScreenProps {
  active: boolean;
  variant: Variant;
  delayMs?: number;
  minVisibleMs?: number;
  /** 메시지 아래에 추가 표시할 요소 (예: 뒤로가기 버튼) */
  children?: React.ReactNode;
}

const ROTATE_INTERVAL_MS = 2500;

export default function LoadingScreen({
  active,
  variant,
  delayMs = 200,
  minVisibleMs = 500,
  children,
}: LoadingScreenProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const shownAtRef = useRef<number | null>(null);

  /* active 변화 감지: 표시/숨김 + 깜빡임 방지 타이머 */
  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    if (active) {
      showTimer = setTimeout(() => {
        setVisible(true);
        shownAtRef.current = Date.now();
        setMsgIdx(0);
      }, delayMs);
    } else if (visible) {
      const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 0;
      const remaining = Math.max(0, minVisibleMs - elapsed);
      hideTimer = setTimeout(() => {
        setVisible(false);
        shownAtRef.current = null;
      }, remaining);
    }

    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [active, delayMs, minVisibleMs, visible]);

  /* 메시지 회전 */
  const raw = t(`loading.${variant}`, { returnObjects: true }) as unknown;
  const msgs: string[] = Array.isArray(raw) ? (raw as string[]) : [String(raw)];

  useEffect(() => {
    if (!visible || msgs.length <= 1) return;
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % msgs.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [visible, msgs.length]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          size={44}
          strokeWidth={2}
          className="animate-spin"
          style={{ color: "var(--color-accent)" }}
        />
        <p
          key={msgIdx}
          className="text-sm font-medium text-center transition-opacity duration-300"
          style={{ color: "var(--color-foreground)" }}
        >
          {msgs[msgIdx]}
        </p>
        {children}
      </div>
    </div>
  );
}
