/* ──────────────────────────────────────────
   닉네임 생성 유틸
   - 한국어 수식어 + 명사 조합으로 랜덤 닉네임 생성
   - 32바이트 이내 보장
   - 6자리 숫자 코드 자동 부여
   ────────────────────────────────────────── */

const ADJECTIVES = [
  /* 짧은 (2글자) */
  "작은", "큰", "예쁜", "밝은", "깊은", "높은", "넓은", "좋은",
  "붉은", "푸른", "하얀", "검은", "맑은", "둥근", "가벼운", "무거운",
  /* 귀여운/감성 (3글자) */
  "귀여운", "빛나는", "따뜻한", "포근한", "달콤한", "신나는", "졸리는",
  "몽글한", "말랑한", "보들한", "통통한", "동글한", "수줍은", "도도한",
  "깜찍한", "느긋한", "천진한", "해맑은", "싱글한", "활발한", "조용한",
  "영롱한", "까칠한", "소심한", "씩씩한", "담백한", "뽀얀", "몽실한",
  "나른한", "촉촉한", "알록달록", "쫀득한", "꾸덕한", "산뜻한", "청량한",
  "새하얀", "노란", "분홍빛", "은빛", "금빛", "투명한", "반투명",
  "아늑한", "편안한", "행복한", "넉넉한", "가냘픈", "탱글한", "쫄깃한",
  "포동한", "야무진", "단단한", "부드러운", "날렵한", "당당한", "유쾌한",
  "장난기많은", "순수한", "정직한", "묵직한", "서늘한", "시원한", "뜨거운",
  /* 의태어/의성어 */
  "반짝반짝", "살랑살랑", "폴짝폴짝", "아장아장", "데굴데굴",
  "보글보글", "졸졸졸", "총총총", "뒤뚱뒤뚱", "살금살금",
  "또각또각", "토닥토닥", "소곤소곤", "두근두근", "쿵쿵쿵",
  "보송보송", "말랑말랑", "톡톡톡", "팔랑팔랑", "하늘하늘",
  /* 긴 (4~5글자) */
  "앙증맞은", "사랑스러운", "새콤달콤", "오동통한", "볼빨간",
  "배고픈", "잠꾸러기", "호기심많은", "엉뚱한", "심쿵하는",
  "눈부신", "상큼한", "발랄한", "복슬복슬", "쪼꼬미",
  "수수한", "아기자기", "소중한", "특별한", "용감한",
  "느릿느릿", "재빠른", "어리바리", "의젓한", "깜놀한",
] as const;

const NOUNS = [
  /* 동물 */
  "고양이", "강아지", "토끼", "햄스터", "다람쥐", "펭귄", "수달",
  "판다", "아기곰", "병아리", "고슴도치", "아기여우", "새끼사슴",
  "코알라", "미어캣", "알파카", "카피바라", "치즈냥이", "삼색이",
  "아기오리", "아기양", "아기물범", "북극여우", "레서판다", "친칠라",
  "앵무새", "올빼미", "참새", "두루미", "돌고래", "해달", "라쿤",
  "날다람쥐", "아기사자", "턱시도냥", "삐약이", "꿀벌",
  "거북이", "두더지", "오소리", "카멜레온", "플라밍고", "백조",
  "아기코끼리", "물개", "기린", "하마", "비둘기", "까치",
  "제비", "청설모", "너구리", "족제비", "매", "부엉이",
  "달팽이", "무당벌레", "아기호랑이", "스컹크", "두꺼비", "반달곰",
  "오리너구리", "퍼핀", "해파리", "불가사리", "조랑말", "당나귀",
  /* 음식/디저트 */
  "떡볶이", "마카롱", "붕어빵", "솜사탕", "꿀떡", "푸딩", "도넛",
  "젤리곰", "초코칩", "호떡", "인절미", "크로플", "타코야끼",
  "팬케이크", "쿠키", "와플", "슈크림", "카스테라", "빵빵이",
  "약과", "탕후루", "모찌", "초코볼", "사탕", "케이크",
  "김밥", "만두", "호두과자", "계란빵", "바게트", "크루아상",
  "타르트", "에클레어", "츄러스", "달고나", "식혜", "수정과",
  "꽈배기", "찐빵", "메론빵", "카레빵", "치즈볼", "감자칩",
  /* 자연/판타지 */
  "별똥별", "무지개", "구름빵", "꽃잎", "눈송이", "달토끼",
  "해바라기", "민들레", "벚꽃", "반딧불이", "오로라", "은하수",
  "새벽별", "안개꽃", "풍선", "물방울", "나비", "잠자리",
  "초승달", "보름달", "소나기", "이슬", "노을", "여울",
  "폭포", "옹달샘", "개나리", "동백꽃", "코스모스", "라벤더",
  "해바라기씨", "클로버", "도토리", "솔방울", "조약돌", "산호",
  /* 사물/캐릭터 */
  "쿠션", "양말", "리본", "요술봉", "보석함", "오르골",
  "램프", "스노볼", "구슬", "편지", "일기장",
  "모자", "가방", "우산", "연필", "지우개", "도장",
  "열쇠", "나침반", "망원경", "돋보기", "종이배", "풍차",
  "딸랑이", "팽이", "요요", "비눗방울", "색연필", "스케치북",
] as const;

/* ── 영어 뜻 맵 ── */
const ADJ_EN: Record<string, string> = {
  "작은": "tiny", "큰": "big", "예쁜": "pretty", "밝은": "bright",
  "깊은": "deep", "높은": "tall", "넓은": "wide", "좋은": "good",
  "붉은": "red", "푸른": "blue", "하얀": "white", "검은": "black",
  "맑은": "clear", "둥근": "round", "가벼운": "light", "무거운": "heavy",
  "귀여운": "cute", "빛나는": "shining", "따뜻한": "warm", "포근한": "cozy",
  "달콤한": "sweet", "신나는": "exciting", "졸리는": "sleepy",
  "몽글한": "fluffy", "말랑한": "squishy", "보들한": "soft", "통통한": "chubby",
  "동글한": "round", "수줍은": "shy", "도도한": "haughty",
  "깜찍한": "adorable", "느긋한": "laid-back", "천진한": "innocent",
  "해맑은": "radiant", "싱글한": "single", "활발한": "lively", "조용한": "quiet",
  "영롱한": "lustrous", "까칠한": "prickly", "소심한": "timid",
  "씩씩한": "brave", "담백한": "simple", "뽀얀": "milky-white", "몽실한": "plump",
  "나른한": "drowsy", "촉촉한": "dewy", "알록달록": "colorful",
  "쫀득한": "chewy", "꾸덕한": "thick", "산뜻한": "fresh", "청량한": "refreshing",
  "새하얀": "snow-white", "노란": "yellow", "분홍빛": "pink", "은빛": "silver",
  "금빛": "golden", "투명한": "transparent", "반투명": "translucent",
  "아늑한": "snug", "편안한": "comfy", "행복한": "happy", "넉넉한": "generous",
  "가냘픈": "delicate", "탱글한": "bouncy", "쫄깃한": "springy",
  "포동한": "plump", "야무진": "sturdy", "단단한": "solid", "부드러운": "gentle",
  "날렵한": "sleek", "당당한": "confident", "유쾌한": "cheerful",
  "장난기많은": "playful", "순수한": "pure", "정직한": "honest",
  "묵직한": "weighty", "서늘한": "cool", "시원한": "crisp", "뜨거운": "hot",
  "반짝반짝": "sparkling", "살랑살랑": "swaying", "폴짝폴짝": "hopping",
  "아장아장": "toddling", "데굴데굴": "rolling", "보글보글": "bubbling",
  "졸졸졸": "trickling", "총총총": "trotting", "뒤뚱뒤뚱": "waddling",
  "살금살금": "tiptoeing", "또각또각": "clip-clop", "토닥토닥": "pat-pat",
  "소곤소곤": "whispering", "두근두근": "thump-thump", "쿵쿵쿵": "thud-thud",
  "보송보송": "fluffy-dry", "말랑말랑": "soft-soft", "톡톡톡": "tap-tap",
  "팔랑팔랑": "fluttering", "하늘하늘": "airy",
  "앙증맞은": "dainty", "사랑스러운": "lovely",
  "새콤달콤": "sweet & sour", "오동통한": "plump", "볼빨간": "rosy-cheeked",
  "배고픈": "hungry", "잠꾸러기": "sleepyhead", "호기심많은": "curious",
  "엉뚱한": "quirky", "심쿵하는": "heart-fluttering", "눈부신": "dazzling",
  "상큼한": "zesty", "발랄한": "bubbly", "복슬복슬": "fluffy", "쪼꼬미": "tiny-tiny",
  "수수한": "modest", "아기자기": "charming", "소중한": "precious",
  "특별한": "special", "용감한": "courageous", "느릿느릿": "slow-poke",
  "재빠른": "swift", "어리바리": "clumsy", "의젓한": "mature", "깜놀한": "startled",
};

const NOUN_EN: Record<string, string> = {
  "고양이": "cat", "강아지": "puppy", "토끼": "bunny", "햄스터": "hamster",
  "다람쥐": "squirrel", "펭귄": "penguin", "수달": "otter",
  "판다": "panda", "아기곰": "baby bear", "병아리": "chick",
  "고슴도치": "hedgehog", "아기여우": "baby fox", "새끼사슴": "fawn",
  "코알라": "koala", "미어캣": "meerkat", "알파카": "alpaca",
  "카피바라": "capybara", "치즈냥이": "cheese cat", "삼색이": "calico cat",
  "아기오리": "duckling", "아기양": "lamb", "아기물범": "seal pup",
  "북극여우": "arctic fox", "레서판다": "red panda", "친칠라": "chinchilla",
  "앵무새": "parrot", "올빼미": "owl", "참새": "sparrow",
  "두루미": "crane", "돌고래": "dolphin", "해달": "sea otter",
  "라쿤": "raccoon", "날다람쥐": "flying squirrel", "아기사자": "lion cub",
  "턱시도냥": "tuxedo cat", "삐약이": "chick", "꿀벌": "honeybee",
  "거북이": "turtle", "두더지": "mole", "오소리": "badger",
  "카멜레온": "chameleon", "플라밍고": "flamingo", "백조": "swan",
  "아기코끼리": "baby elephant", "물개": "seal", "기린": "giraffe",
  "하마": "hippo", "비둘기": "pigeon", "까치": "magpie",
  "제비": "swallow", "청설모": "chipmunk", "너구리": "raccoon dog",
  "족제비": "weasel", "매": "hawk", "부엉이": "owl",
  "달팽이": "snail", "무당벌레": "ladybug", "아기호랑이": "tiger cub",
  "스컹크": "skunk", "두꺼비": "toad", "반달곰": "moon bear",
  "오리너구리": "platypus", "퍼핀": "puffin", "해파리": "jellyfish",
  "불가사리": "starfish", "조랑말": "pony", "당나귀": "donkey",
  "떡볶이": "tteokbokki", "마카롱": "macaron", "붕어빵": "fish-shaped bread",
  "솜사탕": "cotton candy", "꿀떡": "honey rice cake", "푸딩": "pudding",
  "도넛": "donut", "젤리곰": "gummy bear", "초코칩": "chocolate chip",
  "호떡": "hotteok", "인절미": "injeolmi", "크로플": "croffle",
  "타코야끼": "takoyaki", "팬케이크": "pancake", "쿠키": "cookie",
  "와플": "waffle", "슈크림": "cream puff", "카스테라": "castella",
  "빵빵이": "little bread", "약과": "yakgwa", "탕후루": "tanghulu",
  "모찌": "mochi", "초코볼": "choco ball", "사탕": "candy", "케이크": "cake",
  "김밥": "gimbap", "만두": "dumpling", "호두과자": "walnut cookie",
  "계란빵": "egg bread", "바게트": "baguette", "크루아상": "croissant",
  "타르트": "tart", "에클레어": "eclair", "츄러스": "churros",
  "달고나": "dalgona", "식혜": "sikhye", "수정과": "sujeonggwa",
  "꽈배기": "twisted donut", "찐빵": "steamed bun", "메론빵": "melon bread",
  "카레빵": "curry bread", "치즈볼": "cheese ball", "감자칩": "potato chip",
  "별똥별": "shooting star", "무지개": "rainbow", "구름빵": "cloud bread",
  "꽃잎": "petal", "눈송이": "snowflake", "달토끼": "moon rabbit",
  "해바라기": "sunflower", "민들레": "dandelion", "벚꽃": "cherry blossom",
  "반딧불이": "firefly", "오로라": "aurora", "은하수": "milky way",
  "새벽별": "morning star", "안개꽃": "baby's breath", "풍선": "balloon",
  "물방울": "water drop", "나비": "butterfly", "잠자리": "dragonfly",
  "초승달": "crescent moon", "보름달": "full moon", "소나기": "rain shower",
  "이슬": "dewdrop", "노을": "sunset glow", "여울": "rapids",
  "폭포": "waterfall", "옹달샘": "spring well", "개나리": "forsythia",
  "동백꽃": "camellia", "코스모스": "cosmos", "라벤더": "lavender",
  "해바라기씨": "sunflower seed", "클로버": "clover", "도토리": "acorn",
  "솔방울": "pinecone", "조약돌": "pebble", "산호": "coral",
  "쿠션": "cushion", "양말": "socks", "리본": "ribbon",
  "요술봉": "magic wand", "보석함": "jewel box", "오르골": "music box",
  "램프": "lamp", "스노볼": "snow globe", "구슬": "marble",
  "편지": "letter", "일기장": "diary",
  "모자": "hat", "가방": "bag", "우산": "umbrella",
  "연필": "pencil", "지우개": "eraser", "도장": "stamp",
  "열쇠": "key", "나침반": "compass", "망원경": "telescope",
  "돋보기": "magnifier", "종이배": "paper boat", "풍차": "windmill",
  "딸랑이": "rattle", "팽이": "spinning top", "요요": "yo-yo",
  "비눗방울": "soap bubble", "색연필": "colored pencil", "스케치북": "sketchbook",
};

/** 닉네임의 영어 뜻 반환. 형식: "adj noun" */
export function getNicknameMeaning(nickname: string): string | null {
  // 공백 기준으로 분리
  const parts = nickname.trim().split(" ");
  if (parts.length < 2) {
    const nounEn = NOUN_EN[parts[0]];
    return nounEn ?? null;
  }
  // 마지막 단어가 명사, 나머지가 형용사
  const noun = parts[parts.length - 1];
  const adj = parts.slice(0, parts.length - 1).join(" ");
  const adjEn = ADJ_EN[adj];
  const nounEn = NOUN_EN[noun];
  if (adjEn && nounEn) return `${adjEn} ${nounEn}`;
  if (nounEn) return nounEn;
  return null;
}

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
