"use client";

/* ──────────────────────────────────────────
   페르소나(미션) 선택 페이지 (/persona) — T4-03 리디자인
   - 세로 스택 큰 카드 2개 (배경 이미지 + 이름/나이만)
   - 카드 탭 → PersonaDetailModal 전체 표시
   - 모달 CTA "이 페르소나로 시작" → POST role → /chat
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Persona, CreateSessionResponse } from "@/types/api";
import { selectRole } from "@/lib/api";
import { getSavedProfile } from "@/hooks/useSetup";
import { getPersonaImage } from "@/lib/personaImage";
import { titleCase } from "@/lib/textCase";
import PersonaDetailModal from "@/components/persona/PersonaDetailModal";

/* 레벨 → 턴 수 매핑 (BE turnLimit 폴백용) */
const LEVEL_TURN_MAP: Record<string, number> = { "초급": 3, "중급": 5, "고급": 7 };

export default function PersonaPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [openId, setOpenId] = useState<"A" | "B" | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [scene, setScene] = useState("");
  const [sceneEn, setSceneEn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /* localStorage에서 세션 데이터(장소 선택에서 저장) 읽기 */
  useEffect(() => {
    const raw = localStorage.getItem("scenarioData");
    if (!raw) {
      router.replace("/location");
      return;
    }
    try {
      const data = JSON.parse(raw) as CreateSessionResponse;
      /* BE personas 내부 _en 필드가 snake_case로 올 수 있어 camelCase로 보정 */
      const personaList: Persona[] = Object.entries(data.personas).map(
        ([id, p]) => {
          const raw = p as unknown as Record<string, unknown>;
          return {
            ...(p as Persona),
            id: id as "A" | "B",
            roleEn: (p.roleEn ?? (raw.role_en as string | undefined)) || undefined,
            missionEn: (p.missionEn ?? (raw.mission_en as string | undefined)) || undefined,
            genderEn: (p.genderEn ?? (raw.gender_en as string | undefined)) || undefined,
          };
        }
      );
      setPersonas(personaList);
      const firstPersonaRaw = Object.values(data.personas)[0] as unknown as Record<string, unknown>;
      const firstScene = (firstPersonaRaw?.scene as string) || "";
      const firstSceneEn = (firstPersonaRaw?.sceneEn as string) || (firstPersonaRaw?.scene_en as string) || "";
      setScene(data.scene || firstScene);
      setSceneEn(data.sceneEn || firstSceneEn);
    } catch {
      router.replace("/location");
    }
  }, [router]);

  const handleConfirm = async () => {
    if (!openId || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        router.replace("/location");
        return;
      }

      /* POST /v1/sessions/{id}/role */
      const res = await selectRole(sessionId, openId);

      const myPersona = personas.find((p) => p.id === openId)!;
      const counterpart = personas.find((p) => p.id !== openId)!;
      localStorage.setItem("myPersona", JSON.stringify(myPersona));
      localStorage.setItem("counterpart", JSON.stringify({
        name: counterpart.name,
        age: counterpart.age,
        gender: counterpart.gender,
        genderEn: counterpart.genderEn,
        role: counterpart.role,
        roleEn: counterpart.roleEn,
      }));
      localStorage.setItem("scene", res.scene || scene);
      const selectedPersonaData = res.personas?.[openId] as unknown as Record<string, unknown> | undefined;
      localStorage.setItem("sceneEn", res.sceneEn || (selectedPersonaData?.sceneEn as string) || sceneEn);
      const profile = getSavedProfile();
      const fallbackTurns = profile ? (LEVEL_TURN_MAP[profile.koreanLevel] ?? 7) : 7;
      const turnLimit = res.turnLimit > 0 ? res.turnLimit : fallbackTurns;
      localStorage.setItem("turnLimit", String(turnLimit));

      if (res.latestAiResponse) {
        localStorage.setItem("firstAiMessage", res.latestAiResponse);
      }

      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("persona.failedRole"));
      setIsLoading(false);
    }
  };

  if (personas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-tab-inactive text-sm">{t("persona.loadingScenario")}</p>
      </div>
    );
  }

  const openPersona = personas.find((p) => p.id === openId) || null;
  const counterpartPersona = openPersona ? personas.find((p) => p.id !== openId) || null : null;

  return (
    <div className="flex flex-col min-h-screen pt-14" style={{ backgroundColor: "var(--color-background)" }}>
      {/* 헤더 (뒤로가기 + 타이틀) */}
      <div className="px-5 mb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-tab-inactive mb-3 self-start hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t("common.back")}</span>
        </button>
        <h1 className="text-xl font-extrabold text-foreground mb-0.5">
          {t("persona.title")}
        </h1>
        <p className="text-xs text-tab-inactive">
          {t("persona.subtitle")}
        </p>
      </div>

      {/* 가로 평행 카드 2개 (상하 스택, 남은 화면 꽉 채움) */}
      <div className="flex-1 grid grid-rows-2 gap-3 px-3 pb-[10vh] min-h-0">
        {personas.map((persona) => (
          <PersonaBigCard
            key={persona.id}
            persona={persona}
            isEn={isEn}
            onTap={() => setOpenId(persona.id)}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-center mb-3 px-5" style={{ color: "#DC3C3C" }}>{error}</p>
      )}

      {/* 디테일 모달 */}
      {openPersona && counterpartPersona && (
        <PersonaDetailModal
          persona={openPersona}
          counterpart={counterpartPersona}
          scene={scene}
          sceneEn={sceneEn}
          isEn={isEn}
          isLoading={isLoading}
          onClose={() => { if (!isLoading) setOpenId(null); }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

/* ── 세로 빅 카드 (배경 이미지 + 이름/나이만) ── */
function PersonaBigCard({
  persona,
  isEn,
  onTap,
}: {
  persona: Persona;
  isEn: boolean;
  onTap: () => void;
}) {
  const { t } = useTranslation();
  const img = getPersonaImage(persona);
  const ageUnit = t("persona.ageUnit");
  const role = titleCase((isEn && persona.roleEn) || persona.role);

  return (
    <button
      type="button"
      onClick={onTap}
      className="relative w-full h-full min-h-0 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
      style={{ border: "1px solid var(--color-card-border)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={persona.name} className="absolute inset-0 w-full h-full object-cover" />

      {/* 하단 글래스 그라데이션 */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)" }}
      />

      {/* 우상단 A/B 라벨 */}
      <div className="absolute top-3 right-4 text-[26px] font-extrabold leading-none"
        style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
        {persona.id}
      </div>

      {/* 좌하단 텍스트 */}
      <div className="absolute bottom-4 left-5 right-16 text-left">
        <div className="mb-1">
          <span className="text-[26px] font-extrabold leading-none"
            style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
            {persona.name}
          </span>
        </div>
        <p className="text-[14px] font-medium line-clamp-1 mb-1"
          style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
          {persona.age}{ageUnit}
          <span className="mx-1.5 opacity-60">·</span>
          {role}
        </p>
        <p className="text-[11px] font-medium"
          style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
          {t("persona.tapToView")}
        </p>
      </div>
    </button>
  );
}
