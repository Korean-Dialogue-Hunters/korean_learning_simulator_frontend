"use client";

/* ──────────────────────────────────────────
   BottomTabBar 컴포넌트
   - 하단 고정 탭 바 (5개 탭)
   - 현재 경로(pathname)를 감지해 활성 탭 자동 표시
   - 활성: tab-active / 비활성: tab-inactive
   - 맞춤 학습 설정 완료 전 또는 /setup 페이지에서는 숨김
   ────────────────────────────────────────── */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Home, ClipboardList, BookOpen } from "lucide-react";
import { SETUP_DONE_KEY } from "@/hooks/useSetup";

/* 탭 정의 */
interface Tab {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;

/* 상위 3개 탭 (승급 탭은 벨트 이미지를 동적으로 렌더링하므로 별도 처리) */
const TABS: Tab[] = [
  { href: "/",         labelKey: "tabs.home",    icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/history",  labelKey: "tabs.history", icon: <ClipboardList size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/review",   labelKey: "tabs.review",  icon: <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { href: "/level-up", labelKey: "tabs.levelUp", icon: null },
];

// 탭바를 숨기는 경로 목록
const HIDDEN_PATHS = ["/setup", "/location", "/persona", "/settings"];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

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

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-3 py-0.5 transition-colors ${
                  isActive ? "text-tab-active" : "text-tab-inactive"
                }`}
              >
                {tab.href === "/level-up" ? (
                  <div className="relative" style={{ width: ICON_SIZE + 6, height: ICON_SIZE + 6, marginTop: 2 }}>
                    <Image
                      src="/belts/belt_yellow.png"
                      alt="belt"
                      width={ICON_SIZE + 6}
                      height={ICON_SIZE + 6}
                      style={{
                        filter: isActive
                          ? "brightness(0) saturate(100%)"
                          : "grayscale(1) opacity(0.55)",
                      }}
                    />
                    {/* 활성 시 tab-active 색상으로 오버레이 */}
                    {isActive && (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: "var(--color-tab-active)",
                          maskImage: "url(/belts/belt_yellow.png)",
                          maskSize: "contain",
                          maskRepeat: "no-repeat",
                          maskPosition: "center",
                          WebkitMaskImage: "url(/belts/belt_yellow.png)",
                          WebkitMaskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                        }}
                      />
                    )}
                  </div>
                ) : (
                  tab.icon
                )}
                <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
