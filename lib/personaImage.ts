/* ──────────────────────────────────────────
   페르소나 이미지 경로 매핑
   - 임시: id(A/B) 기준으로 1.svg 고정
   - 향후: 페르소나별 견본 여러 장 (/personas/{id}/{n}.{ext}) 중 랜덤/속성 기반 선택
   ────────────────────────────────────────── */

import { Persona } from "@/types/api";

/** 페르소나 카드 배경/디테일에 쓸 이미지 경로 */
export function getPersonaImage(persona: Persona): string {
  /* BE가 personaUrl을 채워주면 그걸 우선 사용 (빈 문자열은 폴백 처리) */
  if (persona.personaUrl) return persona.personaUrl;

  /* 폴백: id 기준 기본 SVG */
  const idLower = (persona.id || "A").toLowerCase();
  return `/personas/${idLower}/1.svg`;
}
