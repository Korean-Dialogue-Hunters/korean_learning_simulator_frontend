"use client";

/* ──────────────────────────────────────────
   페르소나(미션) 선택 페이지 (/persona) — TODO 30~32
   - sessionStorage에서 세션 데이터(personas) 읽기
   - 사용자가 맡을 역할(페르소나) A / B 카드 표시
   - 선택 후 POST /v1/sessions/{id}/role → /chat 이동
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Persona, CreateSessionResponse } from "@/types/api";
import { selectRole } from "@/lib/api";
import { getSavedProfile } from "@/hooks/useSetup";

/* 레벨 → 턴 수 매핑 (BE turnLimit 폴백용) */
const LEVEL_TURN_MAP: Record<string, number> = { "초급": 3, "중급": 5, "고급": 7 };

export default function PersonaPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"A" | "B" | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [scene, setScene] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /* sessionStorage에서 세션 데이터(장소 선택에서 저장한 것) 읽기 */
  useEffect(() => {
    const raw = sessionStorage.getItem("scenarioData");
    if (!raw) {
      router.replace("/location");
      return;
    }
    try {
      const data = JSON.parse(raw) as CreateSessionResponse;
      /* BE personas는 { A: {...}, B: {...} } dict 형태 */
      const personaList: Persona[] = Object.entries(data.personas).map(
        ([id, p]) => ({ ...p, id: id as "A" | "B" })
      );
      setPersonas(personaList);
      setScene(data.scene || "");
    } catch {
      router.replace("/location");
    }
  }, [router]);

  const handleConfirm = async () => {
    if (!selected || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const sessionId = sessionStorage.getItem("sessionId");
      if (!sessionId) {
        router.replace("/location");
        return;
      }

      /* POST /v1/sessions/{id}/role — 역할 선택 + AI 첫 발화 수신 */
      const res = await selectRole(sessionId, selected);

      /* 내 역할 + 상대방 정보 저장 */
      const myPersona = personas.find((p) => p.id === selected)!;
      const counterpart = personas.find((p) => p.id !== selected)!;
      sessionStorage.setItem("myPersona", JSON.stringify(myPersona));
      sessionStorage.setItem("counterpart", JSON.stringify({
        name: counterpart.name,
        age: counterpart.age,
        role: counterpart.role,
      }));
      sessionStorage.setItem("scene", scene);
      /* turnLimit: BE 응답 우선, 없으면 레벨 기반 폴백 */
      const profile = getSavedProfile();
      const fallbackTurns = profile ? (LEVEL_TURN_MAP[profile.koreanLevel] ?? 7) : 7;
      const turnLimit = res.turnLimit > 0 ? res.turnLimit : fallbackTurns;
      sessionStorage.setItem("turnLimit", String(turnLimit));

      /* AI 첫 발화가 있으면 저장 */
      if (res.latestAiResponse) {
        sessionStorage.setItem("firstAiMessage", res.latestAiResponse);
      }

      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 선택에 실패했습니다");
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

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-28">
      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={() => router.back()}
        className="text-tab-inactive text-sm mb-6 self-start"
      >
        ← 뒤로
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">
        {t("persona.title")}
      </h1>
      <p className="text-xs text-tab-inactive mb-8">
        {t("persona.subtitle")}
      </p>

      {/* 시나리오 설명 */}
      {scene && (
        <div className="rounded-2xl p-4 mb-6 bg-card-bg border border-card-border">
          <p className="text-xs text-tab-inactive mb-1">{t("persona.scenario")}</p>
          <p className="text-sm text-foreground leading-relaxed">{scene}</p>
        </div>
      )}

      {/* 페르소나 A / B 카드 */}
      <div className="flex flex-col gap-4">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isSelected={selected === persona.id}
            onSelect={() => setSelected(persona.id)}
          />
        ))}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-center mt-4" style={{ color: "#DC3C3C" }}>{error}</p>
      )}

      {/* 선택 완료 버튼 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || isLoading}
          className={`
            w-full py-4 rounded-2xl font-bold text-sm transition-all
            ${
              selected && !isLoading
                ? "bg-accent text-btn-primary-text active:scale-95 shadow-lg shadow-accent/20"
                : "bg-surface border border-surface-border text-tab-inactive cursor-not-allowed"
            }
          `}
        >
          {isLoading ? t("persona.loading") : t("persona.startBtn")}
        </button>
      </div>
    </div>
  );
}

/* ── 페르소나 카드 컴포넌트 ── */
function PersonaCard({
  persona,
  isSelected,
  onSelect,
}: {
  persona: Persona;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const initial = persona.name.charAt(0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full rounded-2xl px-4 py-4 text-left border transition-all
        ${
          isSelected
            ? "bg-accent/10 border-accent"
            : "bg-surface border-surface-border hover:bg-card-bg active:scale-[0.98]"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* 아바타 원형 */}
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold
            ${isSelected ? "bg-accent/20 text-accent" : "bg-surface-border text-foreground"}
          `}
        >
          {persona.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            initial
          )}
        </div>

        {/* 정보 텍스트 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-foreground">{persona.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              isSelected ? "border-accent text-accent" : "border-surface-border text-tab-inactive"
            }`}>
              {persona.id}
            </span>
          </div>
          <p className="text-xs text-tab-inactive mb-2">
            {persona.age}세 · {persona.gender} · {persona.role}
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            🎯 {persona.mission}
          </p>
        </div>
      </div>
    </button>
  );
}
