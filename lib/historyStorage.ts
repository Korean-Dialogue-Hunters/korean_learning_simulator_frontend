/* ──────────────────────────────────────────
   대화 기록 로컬 저장소
   - localStorage 기반 대화 기록 CRUD
   - 결과 페이지에서 평가 완료 시 저장
   - 기록 탭에서 목록 조회 + 정렬
   ────────────────────────────────────────── */

const STORAGE_KEY = "dialogueHistory";

export interface DialogueRecord {
  sessionId: string;
  scenarioTitle: string;
  location: string;
  scene: string;
  totalScore10: number;
  grade: string;
  feedback: string;
  llmSummary: string;
  turnCount: number;
  createdAt: string; // ISO string
}

/** 전체 기록 조회 */
export function getHistory(): DialogueRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 기록 추가 (중복 sessionId 방지) */
export function addHistory(record: DialogueRecord): void {
  const list = getHistory();
  if (list.some((r) => r.sessionId === record.sessionId)) return;
  list.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 기록 삭제 */
export function removeHistory(sessionId: string): void {
  const list = getHistory().filter((r) => r.sessionId !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 정렬 타입 */
export type SortKey = "recent" | "oldest" | "scoreHigh" | "scoreLow" | "location";

/** 정렬 */
export function sortHistory(list: DialogueRecord[], sortKey: SortKey): DialogueRecord[] {
  const sorted = [...list];
  switch (sortKey) {
    case "recent":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "scoreHigh":
      return sorted.sort((a, b) => b.totalScore10 - a.totalScore10);
    case "scoreLow":
      return sorted.sort((a, b) => a.totalScore10 - b.totalScore10);
    case "location":
      return sorted.sort((a, b) => a.location.localeCompare(b.location));
    default:
      return sorted;
  }
}
