"use client";

/* ──────────────────────────────────────────
   장소 선택 페이지 (/location) — TODO 25~29
   - LOCATION_OPTIONS 배열 기반 동적 렌더링
   - MVP: 한강만 활성화, 나머지 비활성(흐리게)
   - 선택된 장소 강조 표시
   - 선택 완료 → 시나리오 생성 API 호출 → /persona 이동

   ⚡ BE API 연동 전 mock response 사용 중
   🔗 연동 필요: POST /conversation/scenario
   ────────────────────────────────────────── */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCATION_OPTIONS, LocationId } from "@/types/setup";
// import { getSavedProfile } from "@/hooks/useSetup"; // API 연동 시 활성화

// 장소별 배경 설명 텍스트
const LOCATION_DESC: Record<string, string> = {
  hangang: "서울 한강변에서 다양한 사람들과 대화해보세요",
  myeongdong: "명동 거리의 활기찬 분위기 속 대화",
  lottewold: "롯데월드에서 즐거운 한국어 대화",
};

// 장소별 이모지
const LOCATION_EMOJI: Record<string, string> = {
  hangang: "🌊",
  myeongdong: "🛍️",
  lottewold: "🎡",
};

export default function LocationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<LocationId | "">("");
  const [isLoading, setIsLoading] = useState(false);

  // 저장된 프로필 (시나리오 API 연동 시 level 전달에 사용)
  // const profile = getSavedProfile();

  /* ── 선택 완료 버튼 핸들러 ── */
  const handleConfirm = async () => {
    if (!selected || isLoading) return;
    setIsLoading(true);

    try {
      // ⚡ BE API 연동 전: mock 응답 사용
      // 실제 연동 시 아래 주석 해제 후 mock 부분 제거
      /*
      const res = await fetch("/api/conversation/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: selected, level: profile?.level ?? "초급" }),
      });
      const data = await res.json();
      sessionStorage.setItem("scenarioData", JSON.stringify(data));
      */

      // mock: 잠깐 로딩 효과 후 이동
      await new Promise((res) => setTimeout(res, 800));
      router.push("/persona");
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-8 pb-28">
      {/* 상단 뒤로가기 + 제목 */}
      <button
        type="button"
        onClick={() => router.back()}
        className="text-tab-inactive text-sm mb-6 self-start"
      >
        ← 뒤로
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">
        어디서 대화할까요?
      </h1>
      <p className="text-xs text-tab-inactive mb-8">
        장소를 선택하면 그에 맞는 상황이 준비돼요
      </p>

      {/* 장소 버튼 목록 (LOCATION_OPTIONS 배열 기반 동적 렌더링) */}
      <div className="flex flex-col gap-3">
        {LOCATION_OPTIONS.map((loc) => {
          const isDisabled = !loc.available; // MVP: 한강만 활성
          const isSelected = selected === loc.id;

          return (
            <button
              key={loc.id}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && setSelected(loc.id)}
              className={`
                relative w-full rounded-2xl px-5 py-4 text-left border transition-all
                ${
                  isDisabled
                    ? "opacity-35 cursor-not-allowed bg-surface border-surface-border"
                    : isSelected
                    ? "bg-orange/10 border-orange"
                    : "bg-surface border-surface-border hover:bg-card-bg active:scale-[0.98]"
                }
              `}
            >
              {/* 이모지 + 장소명 */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{LOCATION_EMOJI[loc.id] ?? "📍"}</span>
                <div>
                  <p className="font-bold text-base text-foreground">{loc.label}</p>
                  <p className="text-[11px] text-tab-inactive mt-0.5">
                    {LOCATION_DESC[loc.id]}
                  </p>
                </div>
              </div>

              {/* 비활성 뱃지 */}
              {isDisabled && (
                <span className="absolute top-3 right-4 text-[10px] text-tab-inactive border border-surface-border rounded px-1.5 py-0.5">
                  준비 중
                </span>
              )}

              {/* 선택 완료 체크 */}
              {isSelected && (
                <span className="absolute top-3 right-4 text-orange text-lg">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 하단 고정 확인 버튼 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || isLoading}
          className={`
            w-full py-4 rounded-2xl font-bold text-sm transition-all
            ${
              selected && !isLoading
                ? "bg-orange text-background active:scale-95 shadow-lg shadow-orange/20"
                : "bg-surface border border-surface-border text-tab-inactive cursor-not-allowed"
            }
          `}
        >
          {isLoading ? "시나리오 생성 중..." : "이 장소로 시작하기"}
        </button>
      </div>
    </div>
  );
}
