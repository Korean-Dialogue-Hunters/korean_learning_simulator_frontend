"use client";

/* ──────────────────────────────────────────
   맞춤 학습 설정 페이지 (/setup)
   - 0단계: 웰컴 화면
   - 1~5단계: 국적 → 닉네임 → 수준 → 관심 문화 → 가보고 싶은 곳
   - 완료 시 즉시 시작 팝업 표시
   - 결과를 로컬스토리지에 저장
   - 2회차 접속 시 자동으로 홈(/)으로 이동
   - 따뜻한 베이지 톤 라이트 테마 고정 (테마 토글 없음)
   ────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, User, BookOpen, Heart, MapPin } from "lucide-react";
import { useSetup, isSetupDone } from "@/hooks/useSetup";
import { LOCATION_OPTIONS } from "@/types/setup";
import { WARM_THEME, warmPageStyle, warmCtaStyle, COMMON_CLASSES } from "@/lib/designSystem";
import WelcomeScreen from "@/components/setup/WelcomeScreen";
import NationalitySelect from "@/components/setup/NationalitySelect";
import LevelSelect from "@/components/setup/LevelSelect";
import CultureSelect from "@/components/setup/CultureSelect";
import NicknameInput from "@/components/setup/NicknameInput";
import LocationSelect from "@/components/setup/LocationSelect";
import QuickStartModal from "@/components/setup/QuickStartModal";

export default function SetupPage() {
  const router = useRouter();
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

  /* 웰컴 화면 표시 여부 (0단계) */
  const [showWelcome, setShowWelcome] = useState(true);

  /* ── 2회차 접속: 설정 완료 상태면 홈으로 자동 이동 ── */
  useEffect(() => {
    if (isSetupDone()) {
      router.replace("/");
    }
  }, [router]);

  /* ── 단계별 제목 + 부제 + 아이콘 ── */
  const STEP_CONFIG: Record<number, { title: string; subtitle: string; icon: React.ReactNode }> = {
    1: {
      title: "어느 나라에서 오셨나요?",
      subtitle: "맞춤 대화를 위해 알려주세요",
      icon: <Globe size={24} strokeWidth={1.8} />,
    },
    2: {
      title: "닉네임을 정해주세요",
      subtitle: "대화에서 사용할 이름이에요",
      icon: <User size={24} strokeWidth={1.8} />,
    },
    3: {
      title: "현재 한국어 실력은요?",
      subtitle: "수준에 맞는 대화를 준비할게요",
      icon: <BookOpen size={24} strokeWidth={1.8} />,
    },
    4: {
      title: "관심 있는 한국 문화는?",
      subtitle: "대화 주제에 반영됩니다",
      icon: <Heart size={24} strokeWidth={1.8} />,
    },
    5: {
      title: "가장 가보고 싶은 곳은?",
      subtitle: "그곳을 배경으로 대화해봐요",
      icon: <MapPin size={24} strokeWidth={1.8} />,
    },
  };

  /* ── YES 선택: 프로필 저장 → /location으로 이동 ── */
  const handleYes = () => {
    saveProfile();
    router.push("/location");
  };

  /* ── NO 선택: 프로필 저장 → 홈(/)으로 이동 ── */
  const handleNo = () => {
    saveProfile();
    router.push("/");
  };

  /* ── 선택한 장소명 ── */
  const selectedLocationLabel =
    LOCATION_OPTIONS.find((l) => l.id === location)?.label ?? "이 장소";

  const currentConfig = STEP_CONFIG[step];

  /* ── 웰컴 화면 (0단계) ── */
  if (showWelcome) {
    return (
      <div style={warmPageStyle}>
        <WelcomeScreen onStart={() => setShowWelcome(false)} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen px-5 pt-8 pb-8"
      style={{ backgroundColor: WARM_THEME.bg }}
    >
      {/* ── 상단: 뒤로가기 + 닷 인디케이터 ── */}
      <div className="flex items-center justify-between mb-8">
        {/* 뒤로 가기 */}
        {step > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: WARM_THEME.textSub }}
          >
            ← 이전
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowWelcome(true)}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: WARM_THEME.textSub }}
          >
            ← 돌아가기
          </button>
        )}

        {/* 닷 인디케이터 (5개 점) */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                borderRadius: s === step ? 4 : "50%",
                backgroundColor:
                  s <= step
                    ? WARM_THEME.accent
                    : WARM_THEME.dotInactive,
              }}
            />
          ))}
        </div>

        {/* 단계 표시 */}
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-setup-text-sub)" }}
        >
          {step} / 5
        </span>
      </div>

      {/* ── 단계 아이콘 + 제목 + 부제 ── */}
      <div className="mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{
            backgroundColor: WARM_THEME.accentLight,
            color: WARM_THEME.accent,
          }}
        >
          {currentConfig.icon}
        </div>
        <h1
          className="text-xl font-bold"
          style={{ color: WARM_THEME.text }}
        >
          {currentConfig.title}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-setup-text-sub)" }}
        >
          {currentConfig.subtitle}
        </p>
      </div>

      {/* ── 단계별 컴포넌트 렌더링 ── */}
      <div className="flex-1">
        {step === 1 && (
          <NationalitySelect value={country} onChange={setCountry} />
        )}
        {step === 2 && (
          <NicknameInput value={userNickname} onChange={setUserNickname} />
        )}
        {step === 3 && (
          <LevelSelect value={koreanLevel} onChange={setKoreanLevel} />
        )}
        {step === 4 && (
          <CultureSelect value={culturalInterest} onChange={setCulturalInterest} />
        )}
        {step === 5 && (
          <LocationSelect value={location} onChange={setLocation} />
        )}
      </div>

      {/* ── 다음 단계 버튼 ── */}
      <button
        type="button"
        onClick={goNext}
        disabled={!canProceed()}
        className={`${COMMON_CLASSES.fullWidthBtn} mt-6`}
        style={warmCtaStyle(canProceed())}
      >
        {step < 5 ? "다음" : "완료"}
      </button>

      {/* ── 즉시 시작 팝업 ── */}
      {showModal && (
        <QuickStartModal
          locationLabel={selectedLocationLabel}
          onYes={handleYes}
          onNo={handleNo}
        />
      )}
    </div>
  );
}
