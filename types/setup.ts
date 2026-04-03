/* ──────────────────────────────────────────
   맞춤 학습 설정 관련 타입 및 상수 정의
   - FE 내부 필드명: camelCase
   - BE 실제 전송 필드명: snake_case (주석으로 표기)
   ────────────────────────────────────────── */

// 한국어 수준 선택지
export type KoreanLevel = "초급" | "중급" | "고급";

// 관심 문화 선택지
export type CulturalInterest =
  | "K-Content"
  | "K-Pop"
  | "K-Beauty"
  | "K-Food"
  | "K-Gaming·eSports"
  | "Others";

// 가보고 싶은 장소 선택지 (데이터 배열 기반 — 추후 항목 추가 시 여기만 수정)
export const LOCATION_OPTIONS = [
  { id: "hangang", label: "한강", available: true },
  { id: "myeongdong", label: "명동", available: false },
  { id: "lottewold", label: "롯데월드", available: false },
] as const;

export type LocationId = (typeof LOCATION_OPTIONS)[number]["id"];

// 맞춤 학습 설정에서 수집하는 사용자 프로필 데이터
// BE: { user_id, country, user_nickname, korean_level, cultural_interest, location }
export interface SetupProfile {
  userId: string;                     // BE: user_id — UUID (자동 생성, 유저에게 노출하지 않음)
  country: string;                    // BE: country — 국적 (ISO 국가코드, 예: "KR", "US")
  userNickname: string;               // BE: user_nickname — 닉네임
  koreanLevel: KoreanLevel;           // BE: korean_level — 한국어 수준
  culturalInterest: CulturalInterest; // BE: cultural_interest — 관심 한국 문화
  location: LocationId;               // BE: location — 가보고 싶은 장소
}

// 맞춤 학습 설정 단계 번호 (1~5)
export type SetupStep = 1 | 2 | 3 | 4 | 5;

// 자주 쓰는 국가 목록 (드롭다운 최상단 고정)
export const POPULAR_COUNTRIES = [
  { code: "KR", name: "South Korea" },
  { code: "US", name: "United States" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "AU", name: "Australia" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "BR", name: "Brazil" },
] as const;
