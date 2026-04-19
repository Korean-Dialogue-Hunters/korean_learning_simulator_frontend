/* ──────────────────────────────────────────
   장소 카드 배경 이미지 경로 매핑
   - 임시: 장소 id 한글 → 영문 파일명
   - 향후: 실제 사진/일러스트로 교체 (같은 파일명 덮어쓰기)
   ────────────────────────────────────────── */

import { LocationId } from "@/types/setup";

const LOCATION_IMAGE_MAP: Record<string, string> = {
  "한강": "/locations/hangang.png",
  "명동": "/locations/myeongdong.png",
  "롯데월드": "/locations/lotteworld.png",
  "남산": "/locations/namsan.png",
};

export function getLocationImage(id: LocationId | string): string {
  return LOCATION_IMAGE_MAP[id] ?? "/locations/hangang.png";
}
