/* ──────────────────────────────────────────
   한국어 레벨 유틸
   - 셋업 문자열("초급"/"중급"/"고급") ↔ 정수(1~6) 매핑
   - 태권도 벨트(lib/belt.ts)와 연동
   - BE가 user_profile.korean_level을 정수로 돌려주면 그 값을 우선 사용,
     없으면 셋업 문자열을 매핑해서 fallback
   ────────────────────────────────────────── */

import type { KoreanLevel } from "@/types/setup";

/* 셋업 초기 매핑: 초급=1 / 중급=3 / 고급=5 */
export const KOREAN_LEVEL_MAP: Record<KoreanLevel, number> = {
  초급: 1,
  중급: 3,
  고급: 5,
};

/* 정수 → 대응 셋업 카테고리 (1~2: 초급, 3~4: 중급, 5~6: 고급) */
export function levelToCategory(level: number): KoreanLevel {
  if (level >= 5) return "고급";
  if (level >= 3) return "중급";
  return "초급";
}

/* 셋업 문자열 → 정수. 알 수 없는 값은 1로 폴백 */
export function mapKoreanLevel(level: string | undefined | null): number {
  if (!level) return 1;
  if (level in KOREAN_LEVEL_MAP) return KOREAN_LEVEL_MAP[level as KoreanLevel];
  return 1;
}

/* BE 응답이 정수인지 문자열인지 모호할 때 정수로 정규화 */
export function normalizeKoreanLevel(raw: string | number | undefined | null): number {
  if (typeof raw === "number" && raw >= 1 && raw <= 6) return raw;
  if (typeof raw === "string") return mapKoreanLevel(raw);
  return 1;
}
