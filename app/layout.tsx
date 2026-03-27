/**
 * TODO: 다국어(i18n) 지원
 *
 * [작업 내용]
 * 1. next-intl 또는 next-i18n 라이브러리 도입
 * 2. 한국어/영어 번역 JSON 파일 생성 (platform/messages/ko.json, en.json)
 * 3. 모든 하드코딩된 한국어 텍스트를 번역 키로 교체
 * 4. HomeHeader에 한/영 전환 토글 버튼 추가
 * 5. 선택한 언어를 로컬스토리지에 저장
 *
 * [우선순위] Must Have 완료 후 진행
 * [예상 영향 범위] 모든 컴포넌트의 텍스트
 */

import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";

/* ──────────────────────────────────────────
   전체 레이아웃 (Root Layout)
   - 모든 페이지에 공통으로 적용되는 최상위 레이아웃
   - 모바일 웹 고정: max-width 480px, 가운데 정렬
   - suppressHydrationWarning: 테마 클래스(dark/light)가 서버와 클라이언트에서
     다를 수 있어 Next.js 경고를 억제
   ────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "코대헌 — Korean Dialogue Hunters",
  description: "AI와 함께하는 한국어 대화 학습 시뮬레이터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <head>
        {/* 테마 플래시 방지 스크립트
            - 페이지가 그려지기 전에 실행되어 테마 클래스를 즉시 적용
            - 저장된 값 없으면 기본값 dark 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        {/* 모바일 고정 래퍼: 최대 480px, 화면 중앙 배치 */}
        <div className="mx-auto w-full max-w-[480px] min-h-screen relative">
          {children}
          {/* 하단 탭 바: 맞춤 학습 설정 완료 후에만 노출 (BottomTabBar 내부에서 조건 처리) */}
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
