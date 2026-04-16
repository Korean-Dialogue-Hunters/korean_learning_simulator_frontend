/* 단어별 첫 글자 대문자 (Title Case)
   - "sightseeing boat guide" → "Sightseeing Boat Guide"
   - 공백 기준으로 단어를 쪼개 각 단어의 첫 글자만 대문자로
   - 한국어 등 대소문자 구분 없는 글자는 변화 없음 */
export function titleCase(s: string): string {
  if (!s) return s;
  return s.replace(/(^|\s)(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());
}
