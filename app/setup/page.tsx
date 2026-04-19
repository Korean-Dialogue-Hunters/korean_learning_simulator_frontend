"use client";

/* ──────────────────────────────────────────
   맞춤 학습 설정 (/setup)
   - 5단계: 1) 초기설정(언어/테마) 2) 국적 3) 닉네임 4) 관심문화 5) 한국어 수준
   - 마지막 완료 → "지금 바로 대화 시작?" 모달
     · 네: /location 으로 이동 (장소 선택)
     · 아니오: / (홈)
   - 장소 선택 단계 + 셋업에서의 createSession 호출 제거 (T3-05)
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon, Globe, User, BookOpen, Heart } from "lucide-react";
import { useSetup, isSetupDone } from "@/hooks/useSetup";
import { WARM_THEME, warmPageStyle, warmCtaStyle, COMMON_CLASSES } from "@/lib/designSystem";
import WelcomeScreen from "@/components/setup/WelcomeScreen";
import NationalitySelect from "@/components/setup/NationalitySelect";
import LevelSelect from "@/components/setup/LevelSelect";
import CultureSelect from "@/components/setup/CultureSelect";
import NicknameInput from "@/components/setup/NicknameInput";
import InitialSettingsStep from "@/components/setup/InitialSettingsStep";
import StartConfirmModal from "@/components/setup/StartConfirmModal";

export default function SetupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    step,
    country, setCountry,
    userNickname, setUserNickname,
    koreanLevel, setKoreanLevel,
    culturalInterest, setCulturalInterest,
    showModal,
    canProceed,
    goNext,
    goPrev,
    saveProfile,
  } = useSetup();

  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (isSetupDone()) {
      router.replace("/");
    }
  }, [router]);

  const STEP_CONFIG: Record<number, { title: string; subtitle: string; icon: React.ReactNode }> = {
    1: { title: t("setup.step1Title"), subtitle: t("setup.step1Subtitle"), icon: <SettingsIcon size={24} strokeWidth={1.8} /> },
    2: { title: t("setup.step2Title"), subtitle: "", icon: <Globe size={24} strokeWidth={1.8} /> },
    3: { title: t("setup.step3Title"), subtitle: "", icon: <User size={24} strokeWidth={1.8} /> },
    4: { title: t("setup.step4Title"), subtitle: t("setup.step4Subtitle"), icon: <Heart size={24} strokeWidth={1.8} /> },
    5: { title: t("setup.step5Title"), subtitle: t("setup.step5Subtitle"), icon: <BookOpen size={24} strokeWidth={1.8} /> },
  };

  /* 모달 응답: 네 → /location, 아니오 → / */
  const handleYes = () => { saveProfile(); router.push("/location"); };
  const handleNo  = () => { saveProfile(); router.push("/"); };

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
      className="flex flex-col min-h-[100dvh] px-5 pt-16 pb-8"
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
        {currentConfig.subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--color-setup-text-sub)" }}>
            {currentConfig.subtitle}
          </p>
        )}
      </div>

      {/* 단계별 컴포넌트 */}
      <div className="flex-1">
        {step === 1 && <InitialSettingsStep />}
        {step === 2 && <NationalitySelect value={country} onChange={setCountry} />}
        {step === 3 && <NicknameInput value={userNickname} onChange={setUserNickname} />}
        {step === 4 && <CultureSelect value={culturalInterest} onChange={setCulturalInterest} />}
        {step === 5 && <LevelSelect value={koreanLevel} onChange={setKoreanLevel} />}
      </div>

      {/* 다음 버튼 */}
      <button type="button" onClick={goNext} disabled={!canProceed()}
        className={`${COMMON_CLASSES.fullWidthBtn} mt-6`}
        style={warmCtaStyle(canProceed())}>
        {step < 5 ? t("common.next") : t("common.complete")}
      </button>

      {showModal && <StartConfirmModal onYes={handleYes} onNo={handleNo} />}
    </div>
  );
}
