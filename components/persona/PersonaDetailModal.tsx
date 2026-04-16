"use client";

/* ──────────────────────────────────────────
   페르소나 디테일 모달 (T4-03)
   - 풀스크린 오버레이
   - 상단: 관계 헤더 배지(내 역할 ↔ 상대 역할), X 버튼
   - 큰 인물 이미지
   - 정보(이름/나이/성별/역할), 미션, 시나리오
   - 하단 고정 CTA "이 페르소나로 시작"
   ────────────────────────────────────────── */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Target, User2, MapPin, ArrowRight } from "lucide-react";
import { Persona } from "@/types/api";
import { getPersonaImage } from "@/lib/personaImage";
import { titleCase } from "@/lib/textCase";

interface PersonaDetailModalProps {
  persona: Persona;
  counterpart: Persona;
  scene: string;
  sceneEn: string;
  isEn: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PersonaDetailModal({
  persona,
  counterpart,
  scene,
  sceneEn,
  isEn,
  isLoading,
  onClose,
  onConfirm,
}: PersonaDetailModalProps) {
  const { t } = useTranslation();

  /* ESC 닫기 + body 스크롤 잠금 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const myRole = titleCase((isEn && persona.roleEn) || persona.role);
  const partnerRole = titleCase((isEn && counterpart.roleEn) || counterpart.role);
  const gender = (isEn && persona.genderEn) || persona.gender;
  const mission = (isEn && persona.missionEn) || persona.mission;
  const sceneText = (isEn && sceneEn) || scene;
  const ageUnit = t("persona.ageUnit");
  const img = getPersonaImage(persona);

  return (
    <div className="fixed inset-0 z-[300] flex items-stretch justify-center" role="dialog" aria-modal="true">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* 모달 본체 */}
      <div
        className="relative w-full max-w-[480px] flex flex-col"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* 큰 인물 이미지 (상단 ~55vh) */}
        <div className="relative w-full" style={{ height: "55vh", minHeight: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={persona.name} className="absolute inset-0 w-full h-full object-cover" />
          {/* 아래쪽 페이드 */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, var(--color-background))" }}
          />

          {/* 상단 X */}
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", color: "#fff" }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>

          {/* 관계 헤더 배지 */}
          <div className="absolute top-4 left-4 right-16 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start"
              style={{ backgroundColor: "rgba(0,0,0,0.45)", color: "#fff" }}>
              {t("persona.relationLabel")}
            </span>
            <div className="flex items-center gap-1.5 text-[13px] font-bold flex-wrap"
              style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
              <span className="px-2.5 py-1 rounded-md text-[14px] font-extrabold shadow-md"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-btn-primary-text)",
                  textShadow: "none",
                }}>
                {myRole}
              </span>
              <ArrowRight size={14} strokeWidth={2.5} style={{ opacity: 0.85 }} />
              <span className="px-2 py-0.5 rounded-md"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
                {partnerRole}
              </span>
            </div>
          </div>

          {/* 이름/나이 (이미지 하단 위에 얹기) */}
          <div className="absolute bottom-6 left-5 right-5">
            <div className="flex items-end gap-2">
              <h2 className="text-[28px] font-extrabold leading-none"
                style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
                {persona.name}
              </h2>
              <span className="text-[15px] font-bold"
                style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {persona.age}{ageUnit}
              </span>
            </div>
          </div>
        </div>

        {/* 정보 영역 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-5 pb-28 pt-2">
          {/* 정보 */}
          <section className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <User2 size={14} className="text-tab-inactive" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-tab-inactive">
                {t("persona.infoLabel")}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-card-bg border border-card-border">
              <p className="text-sm text-foreground">
                {persona.age}{ageUnit} · {gender} · <span className="font-bold">{myRole}</span>
              </p>
            </div>
          </section>

          {/* 미션 */}
          <section className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Target size={14} className="text-accent" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-tab-inactive">
                {t("persona.missionLabel")}
              </p>
            </div>
            <div className="rounded-2xl p-4 border"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-accent) 10%, var(--color-card-bg))",
                borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
              }}>
              <p className="text-sm text-foreground leading-relaxed">{mission}</p>
            </div>
          </section>

          {/* 시나리오(장면) */}
          {sceneText && (
            <section className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={14} className="text-tab-inactive" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-tab-inactive">
                  {t("persona.scenario")}
                </p>
              </div>
              <div className="rounded-2xl p-4 bg-card-bg border border-card-border">
                <p className="text-sm text-foreground leading-relaxed">{sceneText}</p>
              </div>
            </section>
          )}
        </div>

        {/* 하단 고정 CTA */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-3"
          style={{
            background: "linear-gradient(to top, var(--color-background) 70%, transparent)",
          }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-[16px] transition-all active:scale-[0.97]"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? t("persona.loading") : t("persona.startBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
