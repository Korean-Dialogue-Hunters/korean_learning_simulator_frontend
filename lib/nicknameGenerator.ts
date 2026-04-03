/* ──────────────────────────────────────────
   닉네임 생성 유틸
   - 한국어 수식어 + 명사 조합으로 랜덤 닉네임 생성
   - 32바이트 이내 보장
   - 6자리 숫자 코드 자동 부여
   ────────────────────────────────────────── */

const ADJECTIVES = [
  /* 짧은 (2글자) */
  "작은", "큰", "예쁜", "밝은", "깊은", "높은", "넓은", "좋은",
  /* 귀여운/감성 (3글자) */
  "귀여운", "빛나는", "따뜻한", "포근한", "달콤한", "신나는", "졸리는",
  "몽글한", "말랑한", "보들한", "통통한", "동글한", "수줍은", "도도한",
  "깜찍한", "느긋한", "천진한", "해맑은", "싱글한", "활발한", "조용한",
  "영롱한", "까칠한", "소심한", "씩씩한", "담백한", "뽀얀", "몽실한",
  "나른한", "촉촉한", "알록달록", "쫀득한", "꾸덕한", "산뜻한", "청량한",
  /* 의태어/의성어 */
  "반짝반짝", "살랑살랑", "폴짝폴짝", "아장아장", "데굴데굴",
  "보글보글", "졸졸졸", "총총총", "뒤뚱뒤뚱", "살금살금",
  /* 긴 (4~5글자) */
  "앙증맞은", "사랑스러운", "새콤달콤", "오동통한", "볼빨간",
  "배고픈", "잠꾸러기", "호기심많은", "엉뚱한", "심쿵하는",
  "눈부신", "상큼한", "발랄한", "복슬복슬", "쪼꼬미",
] as const;

const NOUNS = [
  /* 동물 */
  "고양이", "강아지", "토끼", "햄스터", "다람쥐", "펭귄", "수달",
  "판다", "아기곰", "병아리", "고슴도치", "아기여우", "새끼사슴",
  "코알라", "미어캣", "알파카", "카피바라", "치즈냥이", "삼색이",
  "아기오리", "아기양", "아기물범", "북극여우", "레서판다", "친칠라",
  "앵무새", "올빼미", "참새", "두루미", "돌고래", "해달", "라쿤",
  "날다람쥐", "아기사자", "턱시도냥", "삐약이", "꿀벌",
  /* 음식/디저트 */
  "떡볶이", "마카롱", "붕어빵", "솜사탕", "꿀떡", "푸딩", "도넛",
  "젤리곰", "초코칩", "호떡", "인절미", "크로플", "타코야끼",
  "팬케이크", "쿠키", "와플", "슈크림", "카스테라", "빵빵이",
  "약과", "탕후루", "모찌", "초코볼", "사탕", "케이크",
  /* 자연/판타지 */
  "별똥별", "무지개", "구름빵", "꽃잎", "눈송이", "달토끼",
  "해바라기", "민들레", "벚꽃", "반딧불이", "오로라", "은하수",
  "새벽별", "안개꽃", "풍선", "물방울", "나비", "잠자리",
  /* 사물/캐릭터 */
  "쿠션", "양말", "리본", "요술봉", "보석함", "오르골",
  "램프", "스노볼", "구슬", "편지", "일기장",
] as const;

/** UTF-8 기준 문자열의 바이트 수 계산 */
export function getByteLength(str: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).length;
  }
  // Node.js fallback (Jest 환경)
  return Buffer.byteLength(str, "utf8");
}

/** 닉네임 최대 바이트 수 */
export const MAX_NICKNAME_BYTES = 32;

/** 랜덤 정수 (0 이상 max 미만) */
function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** 한국어 수식어+명사 조합의 랜덤 닉네임 생성 (32바이트 이내) */
export function generateRandomNickname(): string {
  // 조합 시도 (최대 20회)
  for (let i = 0; i < 20; i++) {
    const adj = ADJECTIVES[randomInt(ADJECTIVES.length)];
    const noun = NOUNS[randomInt(NOUNS.length)];
    const nickname = adj + " " + noun;
    if (getByteLength(nickname) <= MAX_NICKNAME_BYTES) {
      return nickname;
    }
  }
  // fallback: 짧은 명사만 반환
  return NOUNS[randomInt(NOUNS.length)];
}

/** 닉네임 유효성 검사 */
export function validateNickname(nickname: string): { valid: boolean; error?: string } {
  const trimmed = nickname.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "닉네임을 입력해주세요" };
  }
  if (getByteLength(trimmed) > MAX_NICKNAME_BYTES) {
    return { valid: false, error: "닉네임이 너무 깁니다 (최대 32바이트)" };
  }
  return { valid: true };
}
