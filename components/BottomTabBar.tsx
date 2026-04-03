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
import { Home, MessageCircle, ClipboardList, BookOpen, User } from "lucide-react";
import { SETUP_DONE_KEY } from "@/hooks/useSetup";

/* 탭 정의 */
interface Tab {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;

/* 5개 탭 목록 */
const TABS: Tab[] = [
  { href: "/",        label: "홈",     icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/chat",    label: "대화",   icon: <MessageCircle size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/history", label: "기록",   icon: <ClipboardList size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/review",  label: "복습",   icon: <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/profile", label: "내정보", icon: <User size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
];

// 탭바를 숨기는 경로 목록
const HIDDEN_PATHS = ["/setup", "/location", "/persona"];

export default function BottomTabBar() {
  const pathname = usePathname();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  /* 마운트 시 맞춤 학습 설정 완료 여부 확인 */
  useEffect(() => {
    const done = localStorage.getItem(SETUP_DONE_KEY) === "true";
    setIsSetupComplete(done);
  }, [pathname]); // 경로가 바뀔 때마다 재확인 (설정 완료 직후 반영)

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

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-3 py-0.5 transition-colors ${
                  isActive ? "text-tab-active" : "text-tab-inactive"
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
