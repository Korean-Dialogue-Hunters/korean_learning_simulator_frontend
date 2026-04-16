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
import { ArrowLeft, MapPin } from "lucide-react";
import { LOCATION_OPTIONS, LocationId } from "@/types/setup";
import { getSavedProfile } from "@/hooks/useSetup";
import { createSession } from "@/lib/api";
import LoadingScreen from "@/components/common/LoadingScreen";
import { getLocationImage } from "@/lib/locationImage";
import { clearSessionState } from "@/lib/sessionStorage";

export default function LocationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const LOCATION_DESC: Record<string, string> = {
    "한강": t("location.hangang_desc"),
    "명동": t("location.myeongdong_desc"),
    "롯데월드": t("location.lotteworld_desc"),
  };

  const handlePick = async (locId: LocationId) => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      /* localStorage에서 셋업 프로필 가져오기 */
      const profile = getSavedProfile();
      if (!profile) {
        router.replace("/setup");
        return;
      }

      /* 이전 in-flow 세션 키 초기화 (새 세션 시작 전 스테이트 청소) */
      clearSessionState();

      /* POST /v1/sessions — 세션 생성 */
      const res = await createSession({
        userId: profile.userId,
        userNickname: profile.userNickname,
        country: profile.country,
        koreanLevel: profile.koreanLevel,
        culturalInterest: profile.culturalInterest,
        location: locId,
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
    <div className="flex flex-col h-screen px-5 pt-14 pb-6 overflow-hidden" style={{ backgroundColor: "var(--color-background)" }}>
      <LoadingScreen active={isLoading} variant="scenario" />
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex items-center gap-1 text-sm text-tab-inactive mb-3 self-start hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("common.back")}</span>
      </button>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={18} strokeWidth={2} className="text-accent" />
          <h1 className="text-lg font-extrabold text-foreground">
            {t("location.title")}
          </h1>
        </div>
        <p className="text-xs text-tab-inactive">
          {t("location.subtitle")}
        </p>
      </div>

      {/* 장소 카드 목록 — 탭 즉시 선택 + 세션 생성 */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {LOCATION_OPTIONS.map((loc) => {
          const isDisabled = !loc.available;
          const img = getLocationImage(loc.id);

          return (
            <button
              key={loc.id}
              type="button"
              disabled={isDisabled || isLoading}
              onClick={() => !isDisabled && handlePick(loc.id)}
              className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
              style={{
                border: "1px solid var(--color-card-border)",
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              {/* 배경 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={loc.label}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: isDisabled ? "grayscale(0.7)" : "none" }}
              />

              {/* 하단 그라데이션 */}
              <div
                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)" }}
              />

              {/* 우상단 비활성 뱃지 */}
              {isDisabled && (
                <span
                  className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-md"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  {t("common.comingSoon")}
                </span>
              )}

              {/* 좌하단 텍스트 */}
              <div className="absolute bottom-4 left-5 right-5 text-left">
                <p className="font-extrabold text-[18px] mb-1"
                  style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
                  {loc.label}
                </p>
                <p className="text-[12px] font-medium leading-relaxed line-clamp-2"
                  style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                  {LOCATION_DESC[loc.id]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-center mt-3" style={{ color: "#DC3C3C" }}>{error}</p>
      )}
    </div>
  );
}
