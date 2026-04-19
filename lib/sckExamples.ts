/* ──────────────────────────────────────────
   SCK 어휘 예문 조회
   - /public/data/sck-examples.json (word → example 맵)
   - 최초 호출 시 1회만 fetch, 이후 메모리 캐시
   ────────────────────────────────────────── */

let cache: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;

export async function loadSckExamples(): Promise<Record<string, string>> {
  if (cache) return cache;
  if (loading) return loading;
  loading = fetch("/data/sck-examples.json")
    .then((res) => res.json())
    .then((data: Record<string, string>) => {
      cache = data;
      return data;
    });
  return loading;
}

/** 동기 조회 — index 기반. 이미 로드된 경우에만 반환, 없으면 null */
export function getSckExample(index: string): string | null {
  if (!cache) return null;
  return cache[index] ?? null;
}
