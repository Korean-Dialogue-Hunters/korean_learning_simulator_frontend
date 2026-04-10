"use client";

/* ──────────────────────────────────────────
   장소 선택 페이지 (/location) — TODO 25~29
   - LOCATION_OPTIONS 배열 기반 동적 렌더링
   - MVP: 한강만 활성화, 나머지 비활성(흐리게)
   - 선택된 장소 강조 표시
   - 선택 완료 → 시나리오 생성 API 호출 → /persona 이동

   🔗 연동: POST /v1/sessions → 세션 생성 + 페르소나 수신
   ────────────────────────────────────────── */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Check } from "lucide-react";
import { LOCATION_OPTIONS, LocationId } from "@/types/setup";
import { getSavedProfile } from "@/hooks/useSetup";
import { createSession } from "@/lib/api";

const LOCATION_EMOJI: Record<string, string> = {
  "한강": "🌊",
  "명동": "🛍️",
  "롯데월드": "🎡",
};

export default function LocationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<LocationId | "">("한강");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const LOCATION_DESC: Record<string, string> = {
    "한강": t("location.hangang_desc"),
    "명동": t("location.myeongdong_desc"),
    "롯데월드": t("location.lotteworld_desc"),
  };

  const handleConfirm = async () => {
    if (!selected || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      /* localStorage에서 셋업 프로필 가져오기 */
      const profile = getSavedProfile();
      if (!profile) {
        router.replace("/setup");
        return;
      }

      /* POST /v1/sessions — 세션 생성 */
      const res = await createSession({
        userId: profile.userId,
        userNickname: profile.userNickname,
        country: profile.country,
        koreanLevel: profile.koreanLevel,
        culturalInterest: profile.culturalInterest,
        location: selected,
      });

      /* 세션 데이터를 localStorage에 저장 (역할 선택 페이지에서 사용) */
      localStorage.setItem("sessionId", res.sessionId);
      localStorage.setItem("scenarioData", JSON.stringify(res));

      router.push("/persona");
    } catch (e) {
      setError(e instanceof Error ? e.message : "세션 생성에 실패했습니다");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-28" style={{ backgroundColor: "var(--color-background)" }}>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-6 self-start hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("common.back")}</span>
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={20} strokeWidth={2} className="text-accent" />
          <h1 className="text-xl font-extrabold text-foreground">
            {t("location.title")}
          </h1>
        </div>
        <p className="text-sm text-tab-inactive">
          {t("location.subtitle")}
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
                    {t("common.comingSoon")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-center mt-4" style={{ color: "#DC3C3C" }}>{error}</p>
      )}

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
          {isLoading ? t("location.creating") : t("location.startHere")}
        </button>
      </div>
    </div>
  );
}
