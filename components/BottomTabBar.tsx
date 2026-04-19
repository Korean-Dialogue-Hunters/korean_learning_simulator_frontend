"use client";

/* ──────────────────────────────────────────
   BottomTabBar 컴포넌트
   - 하단 고정 탭 바 (5개 탭)
   - 현재 경로(pathname)를 감지해 활성 탭 자동 표시
   - 활성: tab-active / 비활성: tab-inactive
   - 맞춤 학습 설정 완료 전 또는 /setup 페이지에서는 숨김
   ────────────────────────────────────────── */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Home, ClipboardList, BookOpen, Award } from "lucide-react";
import { SETUP_DONE_KEY } from "@/hooks/useSetup";
import { useExamEligibility } from "@/hooks/useExamEligibility";

/* 탭 정의 */
interface Tab {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  tutorialId: string;
}

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;

const TABS: Tab[] = [
  { href: "/",         labelKey: "tabs.home",    tutorialId: "tutorial-tab-home",    icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/history",  labelKey: "tabs.history", tutorialId: "tutorial-tab-history", icon: <ClipboardList size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/review",   labelKey: "tabs.review",  tutorialId: "tutorial-tab-review",  icon: <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/level-up", labelKey: "tabs.levelUp", tutorialId: "tutorial-tab-levelup", icon: <Award size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
];

// 탭바를 숨기는 경로 목록
const HIDDEN_PATHS = ["/setup", "/location", "/persona", "/settings", "/chat"];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const examEligible = useExamEligibility();

  /* 마운트 시 맞춤 학습 설정 완료 여부 확인 */
  useEffect(() => {
    const done = localStorage.getItem(SETUP_DONE_KEY) === "true";
    setIsSetupComplete(done);
  }, [pathname]);

  // 설정 미완료 or 숨김 경로면 렌더링하지 않음
  if (!isSetupComplete || HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card-bg border-t border-card-border z-50"
    >
      <ul className="flex items-center justify-around py-2.5">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          const showExamBadge = tab.href === "/level-up" && examEligible && !isActive;

          return (
            <li key={tab.href}>
              <Link
                id={tab.tutorialId}
                href={tab.href}
                className={`relative flex flex-col items-center gap-1 px-3 py-0.5 transition-colors ${
                  isActive ? "text-tab-active" : "text-tab-inactive"
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {showExamBadge && (
                    <span
                      aria-hidden
                      className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold text-white animate-pulse"
                      style={{ backgroundColor: "#DC3C3C", boxShadow: "0 0 0 2px var(--color-card-bg)" }}
                    >
                      !
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
