# 프론트엔드 코드 리뷰 리포트

**대상**: `app/`, `components/`, `hooks/`, `lib/`, `types/`
**작성일**: 2026-04-14
**목표**: 초보자도 이해할 수 있게 쉬운 말로, 고쳐야 할 것들을 세 가지로 나눠 정리

---

## 📘 리포트 구조

이 문서는 세 개의 바구니로 나뉘어 있어요.

- 🔴 **문제가 되는 부분** — 버그나 에러를 일으킬 수 있는 것 (당장 고쳐야 함)
- 🟡 **개선하면 좋은 부분** — 코드가 읽기 어렵거나 중복이 많은 부분 (시간 날 때 고치면 좋음)
- ⚪ **안 쓰거나 불필요한 부분** — 실제로는 호출되지 않는 코드 (지워도 됨)

각 항목마다 "왜 문제인지 → 어떻게 고치면 좋을지"를 같이 적어두었어요.

---

# 🔴 문제가 되는 부분

## 1. API 응답 필드명이 실제 백엔드와 다를 수 있음
**파일**: `types/api.ts:32-98`, `lib/api.ts` 전체

프론트엔드는 `data.sessionId`, `data.scenarioTitle`처럼 camelCase 이름으로 응답을 읽어요.
그런데 OpenAPI 명세를 보면 `session_id`, `scenario_title`처럼 snake_case로 적혀 있어요.

**왜 중요**: `undefined`가 뜨면서 결과 페이지가 하얗게 나올 수 있음.
**어떻게**: 자세한 건 `docs/API_MATCH_CHECK.md` 참고. 실제 응답을 브라우저 Network 탭에서 직접 확인 후 처리.

## 2. `evaluateSession`의 `?lang=` 쿼리가 백엔드 명세에 없음
**파일**: `lib/api.ts:129-133`

FE는 피드백 언어를 바꾸려고 `?lang=ko` 같은 쿼리를 붙여 보내는데, OpenAPI 스펙에는 이 파라미터가 없어요.
백엔드가 이 값을 실제로 받는지 확인해봐야 해요. 안 받으면 한국어로만 피드백이 와요.

## 3. API 호출 실패 시 조용히 무시 (silent failure)
**파일**: `app/page.tsx:61-66`, `hooks/useChat.ts:70 부근`

```ts
getReviewCount(...).catch(() => {});
```
처럼 에러를 그냥 삼켜버려요. 사용자는 "복습 개수가 0이네?"라고 생각하지만, 사실 API가 실패한 것일 수 있어요.

**어떻게**: 최소한 `console.error`로 로그 찍고, 가능하면 토스트/배너로 "네트워크 오류" 안내.

## 4. 세션 정리 로직이 하드코딩 + 중복
**파일**: `app/result/page.tsx:118-129`, `app/feedback/page.tsx:150-151`

`lib/activeSession.ts`에 `clearActiveSession()`이라는 전용 함수가 있는데도,
두 페이지에서 `localStorage.removeItem("key1")`, `removeItem("key2")` …를 손으로 나열해서 지우고 있어요.
**위험**: 나중에 키를 하나 더 추가하면 한쪽만 고치고 다른 쪽은 까먹게 돼요 → 좀비 데이터.
**어떻게**: 둘 다 `clearActiveSession()`으로 교체.

## 5. `useEffect` 의존성 배열 누락
**파일**: `app/page.tsx` 메인 화면

홈 진입 시 API를 불러오는 `useEffect`의 의존성 배열에 필요한 상태가 빠져 있어서,
모달이 닫힐 때마다 불필요하게 재실행되거나 혹은 최신 값을 못 읽을 수 있어요.
**어떻게**: ESLint `react-hooks/exhaustive-deps` 룰을 믿고 의존성 배열 정리.

## 6. `Object.entries(personas)`로 페르소나 순서 의존
**파일**: `app/persona/page.tsx:40 부근`

페르소나를 `personas` 객체에서 꺼낼 때 `Object.entries`로 순회해요. JS 객체 키 순서는 대부분 삽입 순이긴 하지만,
백엔드가 `{B: ..., A: ...}`로 보내면 A/B가 뒤집혀서 표시될 수 있어요.
**어떻게**: `personas.A`, `personas.B`로 명시적으로 꺼내기.

## 7. XP 중복 지급 경쟁 가능성
**파일**: `app/result/page.tsx:56-65`, `app/feedback/page.tsx`

XP 지급 로직이 `/result`와 `/feedback` 두 곳에 있음. `isXpAwarded` 플래그로 막긴 하지만, 양쪽이 거의 동시에 열리면 한 번 더 들어갈 수 있어요.
**어떻게**: XP 지급을 한 곳(예: 평가 완료 직후)으로 단일화.

## 8. `i18nextLng`를 localStorage에서 직접 읽기
**파일**: `app/result/page.tsx:48`, `lib/i18n.ts`

`lib/i18n.ts`는 `appLanguage`라는 키에 저장하는데, 결과 페이지에서는 `i18nextLng` 키를 수동으로 읽어요. 키 이름이 달라서 언어 상태가 안 맞을 수 있어요.
**어떻게**: 어디서든 `i18n.language`(라이브러리 공식 API)를 사용.

---

# 🟡 개선하면 좋은 부분

## 9. 점수 추출 로직이 페이지마다 다름
**파일**: `app/feedback/page.tsx`, `app/result/page.tsx`

피드백 페이지에는 `extractScores()` 유틸이 있는데 결과 페이지에는 없어요. 같은 데이터를 서로 다르게 파싱 중.
**어떻게**: `lib/` 아래에 공통 유틸로 빼기.

## 10. 등급 색상 상수가 두 곳에 흩어져 있음
**파일**: `types/user.ts:11-15`, `lib/designSystem.ts`

`GRADE_COLORS`는 타입 파일 안에 하드코딩. 색상은 디자인 시스템에 모여야 읽기 쉬워요.
**어떻게**: `lib/designSystem.ts`로 이동.

## 11. `levelFromTotalXp()`가 선형 탐색
**파일**: `lib/xpSystem.ts:44-53`

`while` 루프로 레벨을 하나씩 더해가며 찾음. 현재는 레벨이 낮아서 괜찮지만, 고레벨에선 느려져요.
**어떻게**: 누적 XP 배열 만들어 이진 탐색, 또는 수식 기반 역함수.

## 12. SCK 레벨 정렬이 매 렌더링마다 실행
**파일**: `app/review/page.tsx:278-306`

`Object.keys().sort()`가 JSX 안에서 호출됨. 리렌더마다 정렬 재계산.
**어떻게**: `useMemo`로 감싸기.

## 13. 날짜 포맷팅도 매 렌더링마다 실행
**파일**: `app/history/page.tsx:206`

히스토리 리스트에서 각 카드마다 날짜를 포맷. 큰 문제는 아니지만 리스트 커지면 느려짐.
**어떻게**: `useMemo` 또는 아이템 컴포넌트 분리 + `React.memo`.

## 14. 에러 메시지가 영어로 사용자에게 그대로 노출
**파일**: `app/location/page.tsx:68 부근`, `lib/api.ts:43`

`throw new Error(\`API POST /sessions 실패 (500): ...\`)`의 원본 메시지가 사용자에게 보일 수 있음.
**어떻게**: 페이지 레벨에서 i18n 키로 치환된 안내 메시지 사용.

## 15. 하드코딩된 한글 텍스트 남아 있음
**파일**: `app/persona/page.tsx:120` ("뒤로" 버튼 등 추정)

i18n 시스템을 쓰는데도 페이지 일부 텍스트가 한글 고정. 영어 모드에서 깨져 보여요.
**어떻게**: `public/locales/*.json` 키 추가 + `t()` 사용.

## 16. 채팅 입력 바이트 제한 상수가 중복/혼란
**파일**: `components/chat/ChatInput.tsx`

`MAX_INPUT_BYTES = 1000`인데 주석에 2000이라고 적힌 부분이 있음. 바이트 길이 계산 로직도 여러 곳.
**어떻게**: 하나의 상수로 통일, 계산 헬퍼 1개로 정리.

---

# ⚪ 안 쓰거나 불필요한 부분

## 17. `clearActiveSession()` 함수가 아무 데서도 호출되지 않음
**파일**: `lib/activeSession.ts`

위 4번 항목과 연결. **사용하거나, 안 쓸 거면 지우거나** 둘 중 하나.

## 18. `SETUP_DONE_KEY` import 후 미사용
**파일**: `components/BottomTabBar.tsx:16`

상수를 import 해놓고 실제 체크는 `"true"` 같은 리터럴로 함. import 제거하거나 상수로 교체.

## 19. 구현 안 된 "Coming Soon" 탭
**파일**: `app/history/page.tsx:173-185`

업적(achievement) / SCK 수집 탭이 플레이스홀더. 지금 구현 계획이 없으면 탭 자체를 숨기는 게 깔끔.

## 20. 오래된 TODO 주석 — 이미 구현된 내용
**파일**: `app/layout.tsx:2-13`

"다국어(i18n) 지원 TODO"라고 적혀 있지만 이미 `components/I18nProvider.tsx`로 구현됨. 주석 삭제.

## 21. "mock 응답 사용 중" 주석
**파일**: `app/chat/page.tsx:11`

"BE 연동 전 mock 사용 중"이라고 적혀 있지만 지금은 실제 API 호출 중. 주석 삭제.

## 22. `sceneEn` 이중 관리
**파일**: `app/chat/page.tsx:139 부근`

`sceneEn` state를 만들어놓고 나중에 localStorage에서 다시 덮어씀. 둘 중 하나만 쓰기.

## 23. `lib/api.ts` 맨 위 주석이 현실과 다를 수 있음
**파일**: `lib/api.ts:1-6`

"FE/BE 모두 camelCase" 주석 — 명세엔 일부 snake_case가 남아 있음. 확인 후 주석 업데이트 or 변환 로직 추가.

---

## 📊 우선순위 요약

| 우선순위 | 항목 번호 | 설명 |
|---|---|---|
| 🚨 P0 (지금 바로) | 1, 2, 3, 4 | API 불일치, 에러 조용히 무시, 세션 정리 중복 |
| ⚠️ P1 (이번 주) | 5, 6, 7, 8, 14 | 훅 의존성, 페르소나 순서, XP 중복, i18n 키 통일 |
| 📝 P2 (시간 날 때) | 9~13, 15, 16 | 리팩터링/성능/i18n 누락 |
| 🧹 P3 (청소) | 17~23 | 죽은 코드/오래된 주석 제거 |

---

## 💡 작업 팁

- **한 PR에 한 주제만**: 예를 들어 "세션 정리 로직 통일 (#4, #17)" 하나, "i18n 키 통일 (#8, #15)" 하나. 리뷰하기 쉬워져요.
- **`npm run build` 꼭 통과**: `CLAUDE.md` 규칙 — main 머지 전엔 항상 빌드 돌리기.
- **수정 전 백엔드 확인부터**: P0 1·2번은 FE만 고쳐봐야 소용없어요. 실제 응답 JSON부터 확인.
