"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Globe, User, BookOpen, Heart, MapPin } from "lucide-react";
import { useSetup, isSetupDone, getSavedProfile } from "@/hooks/useSetup";
import { LOCATION_OPTIONS } from "@/types/setup";
import { createSession } from "@/lib/api";
import { WARM_THEME, warmPageStyle, warmCtaStyle, COMMON_CLASSES } from "@/lib/designSystem";
import WelcomeScreen from "@/components/setup/WelcomeScreen";
import NationalitySelect from "@/components/setup/NationalitySelect";
import LevelSelect from "@/components/setup/LevelSelect";
import CultureSelect from "@/components/setup/CultureSelect";
import NicknameInput from "@/components/setup/NicknameInput";
import LocationSelect from "@/components/setup/LocationSelect";
import QuickStartModal from "@/components/setup/QuickStartModal";
import ScenarioLoading from "@/components/common/ScenarioLoading";

export default function SetupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    step,
    country, setCountry,
    userNickname, setUserNickname,
    koreanLevel, setKoreanLevel,
    culturalInterest, setCulturalInterest,
    location, setLocation,
    showModal,
    canProceed,
    goNext,
    goPrev,
    saveProfile,
  } = useSetup();

  const [showWelcome, setShowWelcome] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (isSetupDone()) {
      router.replace("/");
    }
  }, [router]);

  const STEP_CONFIG: Record<number, { title: string; subtitle: string; icon: React.ReactNode }> = {
    1: { title: t("setup.step1Title"), subtitle: "", icon: <Globe size={24} strokeWidth={1.8} /> },
    2: { title: t("setup.step2Title"), subtitle: "", icon: <User size={24} strokeWidth={1.8} /> },
    3: { title: t("setup.step3Title"), subtitle: t("setup.step3Subtitle"), icon: <Heart size={24} strokeWidth={1.8} /> },
    4: { title: t("setup.step4Title"), subtitle: t("setup.step4Subtitle"), icon: <BookOpen size={24} strokeWidth={1.8} /> },
    5: { title: t("setup.step5Title"), subtitle: "", icon: <MapPin size={24} strokeWidth={1.8} /> },
  };

  const handleYes = async () => {
    saveProfile();
    const profile = getSavedProfile();
    if (!profile) {
      router.push("/location");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    try {
      /* POST /v1/sessions — 선택된 장소로 바로 세션 생성 */
      const res = await createSession({
        userId: profile.userId,
        userNickname: profile.userNickname,
        country: profile.country,
        koreanLevel: profile.koreanLevel,
        culturalInterest: profile.culturalInterest,
        location: profile.location,
      });
      localStorage.setItem("sessionId", res.sessionId);
      localStorage.setItem("scenarioData", JSON.stringify(res));
      router.push("/persona");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "세션 생성에 실패했습니다");
      setIsCreating(false);
    }
  };
  const handleNo  = () => { saveProfile(); router.push("/"); };

  const selectedLocationLabel =
    LOCATION_OPTIONS.find((l) => l.id === location)?.label ?? "";

  const currentConfig = STEP_CONFIG[step];

  if (showWelcome) {
    return (
      <div style={warmPageStyle}>
        <WelcomeScreen onStart={() => setShowWelcome(false)} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen px-5 pt-16 pb-8"
      style={{ backgroundColor: WARM_THEME.bg }}
    >
      {/* 상단: 뒤로가기 + 닷 인디케이터 */}
      <div className="flex items-center justify-between mb-8">
        {step > 1 ? (
          <button type="button" onClick={goPrev}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: WARM_THEME.textSub }}>
            {t("common.prev")}
          </button>
        ) : (
          <button type="button" onClick={() => setShowWelcome(true)}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: WARM_THEME.textSub }}>
            {t("common.goBack")}
          </button>
        )}

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="rounded-full transition-all duration-300"
              style={{
                width: s === step ? 24 : 8, height: 8,
                borderRadius: s === step ? 4 : "50%",
                backgroundColor: s <= step ? WARM_THEME.accent : WARM_THEME.dotInactive,
              }} />
          ))}
        </div>

        <span className="text-xs font-medium" style={{ color: "var(--color-setup-text-sub)" }}>
          {step} {t("common.of5")}
        </span>
      </div>

      {/* 단계 아이콘 + 제목 */}
      <div className="mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: WARM_THEME.accentLight, color: WARM_THEME.accent }}>
          {currentConfig.icon}
        </div>
        <h1 className="text-xl font-bold" style={{ color: WARM_THEME.text }}>
          {currentConfig.title}
        </h1>
        {(step === 3 || step === 4) && (
          <p className="text-sm mt-1" style={{ color: "var(--color-setup-text-sub)" }}>
            {currentConfig.subtitle}
          </p>
        )}
      </div>

      {/* 단계별 컴포넌트 */}
      <div className="flex-1">
        {step === 1 && <NationalitySelect value={country} onChange={setCountry} />}
        {step === 2 && <NicknameInput value={userNickname} onChange={setUserNickname} />}
        {step === 3 && <CultureSelect value={culturalInterest} onChange={setCulturalInterest} />}
        {step === 4 && <LevelSelect value={koreanLevel} onChange={setKoreanLevel} />}
        {step === 5 && <LocationSelect value={location} onChange={setLocation} />}
      </div>

      {/* 다음 버튼 */}
      <button type="button" onClick={goNext} disabled={!canProceed()}
        className={`${COMMON_CLASSES.fullWidthBtn} mt-6`}
        style={warmCtaStyle(canProceed())}>
        {step < 5 ? t("common.next") : t("common.complete")}
      </button>

      {showModal && !isCreating && (
        <QuickStartModal
          locationLabel={selectedLocationLabel}
          onYes={handleYes}
          onNo={handleNo}
        />
      )}

      {isCreating && <ScenarioLoading />}

      {createError && !isCreating && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[440px] px-4 py-3 rounded-xl text-sm text-center z-[210]"
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid #DC3C3C",
            color: "#DC3C3C",
          }}
        >
          {createError}
        </div>
      )}
    </div>
  );
}
