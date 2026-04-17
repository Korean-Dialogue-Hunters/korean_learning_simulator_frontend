/* ──────────────────────────────────────────
   별 진척도 로컬 저장소
   - BE 세션 목록에 별 필드가 없을 때 FE 폴백으로 사용
   - 퀴즈/플래시카드 완료 시 결과를 localStorage에 저장
   - 기록 탭에서 BE 값 우선, 없으면 여기서 조회
   ────────────────────────────────────────── */

const STAR_KEY = "starProgress";

interface StarData {
  quizPassed?: boolean;      // 퀴즈 정답률 75% 이상
  flashcardDone?: boolean;   // 플래시카드 전체 완료
}

/* 전체 데이터 읽기 */
function loadAll(): Record<string, StarData> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) || "{}");
  } catch {
    return {};
  }
}

/* 저장 */
function saveAll(data: Record<string, StarData>) {
  localStorage.setItem(STAR_KEY, JSON.stringify(data));
}

/* 퀴즈 통과 저장 */
export function markQuizPassed(sessionId: string) {
  const all = loadAll();
  all[sessionId] = { ...all[sessionId], quizPassed: true };
  saveAll(all);
}

/* 플래시카드 완료 저장 */
export function markFlashcardDone(sessionId: string) {
  const all = loadAll();
  all[sessionId] = { ...all[sessionId], flashcardDone: true };
  saveAll(all);
}

/* 세션별 별 상태 조회 */
export function getStarProgress(sessionId: string): StarData {
  return loadAll()[sessionId] ?? {};
}
