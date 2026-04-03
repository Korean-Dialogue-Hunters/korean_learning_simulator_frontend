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
import { ArrowLeft, MapPin, Check } from "lucide-react";
import { LOCATION_OPTIONS, LocationId } from "@/types/setup";

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

  const handleConfirm = async () => {
    if (!selected || isLoading) return;
    setIsLoading(true);

    try {
      // ⚡ BE API 연동 전: mock 응답 사용
      await new Promise((res) => setTimeout(res, 800));
      router.push("/persona");
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-28" style={{ backgroundColor: "var(--color-background)" }}>
      {/* 상단 헤더 */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-8 self-start hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>뒤로</span>
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={20} strokeWidth={2} className="text-accent" />
          <h1 className="text-xl font-extrabold text-foreground">
            어디서 대화할까요?
          </h1>
        </div>
        <p className="text-sm text-tab-inactive">
          장소를 선택하면 그에 맞는 상황이 준비돼요
        </p>
      </div>

      {/* 장소 카드 목록 */}
      <div className="flex flex-col gap-4">
        {LOCATION_OPTIONS.map((loc) => {
          const isDisabled = !loc.available;
          const isSelected = selected === loc.id;

          return (
            <button
              key={loc.id}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && setSelected(loc.id)}
              className="relative w-full rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                backgroundColor: isSelected
                  ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-card-bg))"
                  : isDisabled
                  ? "var(--color-surface)"
                  : "var(--color-card-bg)",
                border: isSelected
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-card-border)",
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                padding: isSelected ? "19px" : "20px",
              }}
            >
              <div className="flex items-center gap-4">
                {/* 이모지 원형 배경 */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                  style={{
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--color-accent) 20%, transparent)"
                      : "var(--color-surface)",
                  }}
                >
                  {LOCATION_EMOJI[loc.id] ?? "📍"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-foreground">{loc.label}</p>
                  <p className="text-[12px] text-tab-inactive mt-1 leading-relaxed">
                    {LOCATION_DESC[loc.id]}
                  </p>
                </div>

                {/* 선택 체크 / 비활성 뱃지 */}
                {isSelected && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      color: "var(--color-btn-primary-text)",
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
                {isDisabled && (
                  <span className="text-[10px] text-tab-inactive border border-card-border rounded-full px-2 py-0.5 shrink-0">
                    준비 중
                  </span>
                )}
              </div>
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
          className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{
            backgroundColor: selected && !isLoading
              ? "var(--color-accent)"
              : "var(--color-surface)",
            color: selected && !isLoading
              ? "var(--color-btn-primary-text)"
              : "var(--color-tab-inactive)",
            boxShadow: selected && !isLoading
              ? "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)"
              : "none",
            cursor: selected && !isLoading ? "pointer" : "not-allowed",
          }}
        >
          {isLoading ? "시나리오 생성 중..." : "이 장소로 시작하기"}
        </button>
      </div>
    </div>
  );
}
