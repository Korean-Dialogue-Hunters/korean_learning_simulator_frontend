"use client";

/* ──────────────────────────────────────────
   페르소나 선택 페이지 (/persona) — TODO 30~32
   - AI가 생성한 페르소나 A / B 카드 표시
   - 이름 / 직업 / 나이 / 성별 / 대화 목적
   - 선택 후 /chat으로 이동

   ⚡ BE API 연동 전 mock 페르소나 사용 중
   🔗 연동: POST /conversation/scenario 응답에서 personas 사용
   ────────────────────────────────────────── */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Persona } from "@/types/api";

/* ── Mock 페르소나 (BE API 완성 후 sessionStorage에서 읽어오는 방식으로 교체) ── */
const MOCK_PERSONAS: [Persona, Persona] = [
  {
    id: "A",
    name: "김민준",
    age: 23,
    gender: "남성",
    occupation: "대학생",
    purpose: "한강 자전거길을 달리다 길을 잃어 도움을 요청하는 대학생",
  },
  {
    id: "B",
    name: "이서연",
    age: 28,
    gender: "여성",
    occupation: "직장인",
    purpose: "점심 도시락을 먹으러 나왔다가 맛집 추천을 부탁하는 직장인",
  },
];

export default function PersonaPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"A" | "B" | null>(null);

  // 실제 연동 시: sessionStorage에서 시나리오 데이터 읽기
  // const scenarioData = JSON.parse(sessionStorage.getItem("scenarioData") ?? "{}");
  // const personas = scenarioData.personas ?? MOCK_PERSONAS;
  const personas = MOCK_PERSONAS;

  const handleConfirm = () => {
    if (!selected) return;
    // 선택한 페르소나 ID를 sessionStorage에 저장 후 채팅 이동
    sessionStorage.setItem("selectedPersona", selected);
    router.push("/chat");
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-8 pb-28">
      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={() => router.back()}
        className="text-tab-inactive text-sm mb-6 self-start"
      >
        ← 뒤로
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">
        대화 상대를 선택하세요
      </h1>
      <p className="text-xs text-tab-inactive mb-8">
        AI가 이 역할을 연기해 대화 연습을 도와드려요
      </p>

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

      {/* 선택 완료 버튼 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          className={`
            w-full py-4 rounded-2xl font-bold text-sm transition-all
            ${
              selected
                ? "bg-orange text-background active:scale-95 shadow-lg shadow-orange/20"
                : "bg-surface border border-surface-border text-tab-inactive cursor-not-allowed"
            }
          `}
        >
          이 사람과 대화 시작
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
  // 이니셜 아바타 (이미지 없을 때)
  const initial = persona.name.charAt(0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full rounded-2xl px-4 py-4 text-left border transition-all
        ${
          isSelected
            ? "bg-orange/10 border-orange"
            : "bg-surface border-surface-border hover:bg-card-bg active:scale-[0.98]"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* 아바타 원형 */}
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold
            ${isSelected ? "bg-orange/20 text-orange" : "bg-surface-border text-foreground"}
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
          {/* 이름 + 뱃지 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-foreground">{persona.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              isSelected ? "border-orange text-orange" : "border-surface-border text-tab-inactive"
            }`}>
              {persona.id}
            </span>
          </div>

          {/* 나이 / 성별 / 직업 */}
          <p className="text-xs text-tab-inactive mb-2">
            {persona.age}세 · {persona.gender} · {persona.occupation}
          </p>

          {/* 대화 목적 */}
          <p className="text-xs text-foreground/80 leading-relaxed">
            &ldquo;{persona.purpose}&rdquo;
          </p>
        </div>
      </div>
    </button>
  );
}
