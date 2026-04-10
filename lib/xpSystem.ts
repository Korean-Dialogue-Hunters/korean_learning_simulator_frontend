/* ──────────────────────────────────────────
   XP / 레벨 시스템
   - 레벨 공식: floor(50 + 0.5 × level²)
   - Lv100+: 5050 고정
   - localStorage에 userId별 저장
   ────────────────────────────────────────── */

export interface XpData {
  totalXp: number;
  level: number;
}

export interface XpBarInfo {
  level: number;
  currentLevelXp: number;
  requiredLevelXp: number;
  progressPercent: number;
}

export interface XpGainResult {
  xpGained: number;
  prevTotalXp: number;
  newTotalXp: number;
  prevLevel: number;
  newLevel: number;
}

/** 해당 레벨에서 다음 레벨까지 필요한 XP */
export function xpRequiredForLevel(level: number): number {
  if (level >= 100) return 5050;
  return Math.floor(50 + 0.5 * level * level);
}

/** 특정 레벨에 도달하기 위한 누적 XP */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

/** 누적 XP로부터 현재 레벨 계산 */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpRequiredForLevel(level);
    if (accumulated + needed > totalXp) return level;
    accumulated += needed;
    level++;
  }
}

/** XP 바 표시용 정보 */
export function getXpBarInfo(totalXp: number): XpBarInfo {
  const level = levelFromTotalXp(totalXp);
  const cumulative = cumulativeXpForLevel(level);
  const currentLevelXp = totalXp - cumulative;
  const requiredLevelXp = xpRequiredForLevel(level);
  const progressPercent = Math.min(
    Math.round((currentLevelXp / requiredLevelXp) * 100),
    100,
  );
  return { level, currentLevelXp, requiredLevelXp, progressPercent };
}

/* ── localStorage 읽기/쓰기 ── */

function storageKey(userId: string) {
  return `xpData_${userId}`;
}

function awardedKey(userId: string) {
  return `xpAwarded_${userId}`;
}

export function getXpData(userId: string): XpData {
  if (typeof window === "undefined") return { totalXp: 0, level: 1 };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return { totalXp: 0, level: 1 };
}

function saveXpData(userId: string, data: XpData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(data));
}

/** XP 추가 — 이전/이후 상태 반환 */
export function addXp(userId: string, amount: number): XpGainResult {
  const prev = getXpData(userId);
  const prevLevel = levelFromTotalXp(prev.totalXp);
  const newTotalXp = prev.totalXp + amount;
  const newLevel = levelFromTotalXp(newTotalXp);

  saveXpData(userId, { totalXp: newTotalXp, level: newLevel });

  return {
    xpGained: amount,
    prevTotalXp: prev.totalXp,
    newTotalXp,
    prevLevel,
    newLevel,
  };
}

/* ── 중복 지급 방지 ── */

export function isXpAwarded(userId: string, activityId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(awardedKey(userId));
    if (!raw) return false;
    const set: string[] = JSON.parse(raw);
    return set.includes(activityId);
  } catch {
    return false;
  }
}

export function markXpAwarded(userId: string, activityId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(awardedKey(userId));
    const set: string[] = raw ? JSON.parse(raw) : [];
    set.push(activityId);
    // 최근 200개만 유지
    const trimmed = set.slice(-200);
    localStorage.setItem(awardedKey(userId), JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

/* ── 대화 점수 → XP 변환 ── */

export function calcConversationXp(totalScore10: number): number {
  if (totalScore10 <= 5.0) return 50;       // C등급: +0
  if (totalScore10 <= 7.0) return 60;       // B등급: +10
  if (totalScore10 <= 9.0) return 70;       // A등급: +20
  return 100;                                // S등급: +50
}
