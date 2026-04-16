/* ──────────────────────────────────────────
   태권도 벨트 시스템
   - korean_level (1~6) → 벨트 색상·이미지 매핑
   ────────────────────────────────────────── */

export interface BeltInfo {
  level: number;
  name: string;       // 색상 이름 (영문)
  nameKo: string;     // 색상 이름 (한글)
  color: string;      // HEX 색상 (테두리 등 UI용)
  image: string;      // 이미지 경로
}

const BELTS: BeltInfo[] = [
  { level: 1, name: "Yellow",  nameKo: "노랑",  color: "#D4A017", image: "/belts/belt_yellow.png" },
  { level: 2, name: "Blue",    nameKo: "파랑",  color: "#3C82F6", image: "/belts/belt_blue.png" },
  { level: 3, name: "Purple",  nameKo: "보라",  color: "#9333EA", image: "/belts/belt_purple.png" },
  { level: 4, name: "Brown",   nameKo: "갈색",  color: "#92600A", image: "/belts/belt_brown.png" },
  { level: 5, name: "Red",     nameKo: "빨강",  color: "#DC2626", image: "/belts/belt_red.png" },
  { level: 6, name: "Black",   nameKo: "검정",  color: "#1A1A1A", image: "/belts/belt_black.png" },
];

/* korean_level (1~6) → BeltInfo 반환. 범위 밖이면 1급으로 폴백 */
export function getBelt(koreanLevel: number): BeltInfo {
  return BELTS.find((b) => b.level === koreanLevel) ?? BELTS[0];
}
