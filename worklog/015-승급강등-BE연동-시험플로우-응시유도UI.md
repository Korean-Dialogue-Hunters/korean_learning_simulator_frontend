# 015 — 승급/강등 BE 연동 + 시험 응시 플로우 + 응시 유도 UI

푸시 기준: `feat/promotion-integration` → `dev` PR 예정 (2026-04-20)
바탕: BE가 승급 시험 + korean_level 증가 + 강등 로직 완료 알림 (2026-04-20)

## 작업 범위
하나의 푸시에 묶인 작업을 그룹별로 정리.

1. **트랙 5 — 승급/강등 실연동 (T5-05 / T5-09 / T5-10 / T5-11 / T5-12)**
2. **T9-03 — 프로필 `korean_level` 업데이트 훅**
3. **T10-01 — 승급/강등 로직 통합**
4. **T5-13 (신규) — 응시 가능 시각 유도 UI**

---

## 1) 승급 시험 플로우

### 타입/API
| 파일 | 변경 |
|------|------|
| `types/api.ts` | `CreateExamRequest`, `ExamResultResponse`(`status/message/score/passed/previousLevel/newLevel`), `LevelDownEligibilityResponse`, `LevelDownApplyResponse`, `LevelDownOutcome` 추가. `EvaluationResponse`에 `levelDown?: LevelDownOutcome | null` 추가. `LevelUpEligibilityResponse.nextLevel`을 `number | null`로 완화 (최고 레벨일 때 BE가 null 반환) |
| `lib/api.ts` | 4개 래퍼 추가 — `createExamSession(userId, location)`, `evaluateExamSession(sessionId)`, `getLevelDownEligibility(userId)`, `applyLevelDown(userId)` |

### 상태/라우팅 분기
기존 `/location → /persona → /chat → /feedback → /result` 파이프라인을 그대로 재사용하되, `localStorage.examMode === "true"`일 때만 분기:
- `/level-up` → `handleStartExam` → `examMode=true` 세팅 후 `/location` 이동
- `app/location/page.tsx` → 세션 생성 시 `examMode`이면 `createExamSession` 호출, 아니면 기존 `createSession`. `clearSessionState()` 뒤에도 플래그 유지하도록 재쓰기
- `app/chat/page.tsx` → 종료 CTA 클릭 시 `examMode`이면 `/level-up/exam-result`로, 아니면 `/result`로

### `/level-up/exam-result` 신규 페이지
- `evaluateExamSession(sessionId)` 호출 → 결과 수신
- 통과 시: `Trophy` + 이전 벨트 → 새 벨트 애니메이션, `refreshProfileFromBE`로 TierCard 벨트 즉시 갱신
- 실패 시: `XCircle` + 점수 + 격려 문구
- 종료 시 `clearSessionState()` + `clearExamEligibilityCache()` 후 `/level-up` 복귀

### `/level-up` 응시 버튼 활성화
- `eligibility.eligible === true`일 때 "응시하기" 버튼 활성 (기존 Lock 카드 대체)
- 최고 레벨(6급)에서는 `isMaxLevel` 가드로 비활성

**Why:** BE가 세션 모델/턴/평가 파이프라인을 그대로 쓰고 endpoint만 다르게 열어준 구조라, FE에서도 경로만 bool 플래그로 분기하는 게 가장 적게 건드리면서 가장 안전함. 새 전용 라우트(`/level-up/exam`)까지 파면 tutorial/handler 중복이 생김.

---

## 2) 강등 감지 UI

| 파일 | 변경 |
|------|------|
| `app/feedback/page.tsx` | `evalData.levelDown?.applied === true`면 `refreshProfileFromBE` 호출해 TierCard 벨트 갱신. 상단에 빨간색 `TrendingDown` 배너(`levelUp.demoteTitle`/`demoteDesc`) 출력. `prev`/`next` 벨트 이름으로 본문 보간 |
| `public/locales/{ko,en}.json` | `levelUp.demoteTitle`, `levelUp.demoteDesc` 신규. `reqExamReady`, `examPassTitle/FailTitle/ScoreLabel`, `backToLevelUp`, `examFinished`, `examResultBtn`, `examLoadFailed`, `takeExam` 추가 |

**Why:** 유저가 자기도 모르는 사이 벨트가 내려간 상태면 홈 UI가 거짓말을 하게 됨. `/feedback`은 대화가 끝날 때마다 들르는 페이지라 고지 포인트로 적절함.

---

## 3) korean_level 캐시/동기화

| 파일 | 변경 |
|------|------|
| `lib/profileSync.ts` **(신규)** | `getEffectiveKoreanLevel()` / `setKoreanLevelOverride(level)` / `refreshProfileFromBE(userId)` 3종 세트. 셋업 시점에 localStorage에 저장한 `koreanLevel`(문자열)과 BE가 올려준 정수 레벨(override)을 분리 관리 |
| `app/page.tsx`, `app/level-up/page.tsx`, `app/level-up/exam-result/page.tsx` | 페이지 마운트 시 `refreshProfileFromBE` 호출 → 성공 시 로컬 state + override 갱신 |

**Why (T9-03):** 기존 FE는 셋업 한 번 기록한 문자열 레벨(`초급/중급/고급`)을 들고 다녔고 BE가 올려도 TierCard가 안 따라옴. override 키를 분리해서 "셋업 원본은 건드리지 않고 BE 최신값만 덮어쓰기" 가능하게 함.

---

## 4) 응시 유도 UI (T5-13)

### 신규: `hooks/useExamEligibility.ts`
- `getLevelUpEligibility(userId)` 호출 → `eligible` 불리언 반환
- 첫 렌더는 localStorage 캐시(`examEligibleCache`) 값으로 즉시 표시 → 네트워크 응답 후 갱신
- `clearExamEligibilityCache()` export — 시험 종료 후 수동 invalidate용

### BottomTabBar
- `Award`(승급) 탭 아이콘 위에 빨간 `!` 배지 + `animate-pulse` (현재 탭이 `/level-up`이면 비표시)
- 배지는 `#DC3C3C` + 카드 배경색 링 쉐도우로 테두리 분리

### TierCard
- 벨트 박스에 `animate-pulse` 클래스 + `box-shadow` 벨트색 반투명 외곽 링
- 우상단 빨간 `!` 배지(BottomTabBar와 같은 스타일)

### invalidation
- `/level-up/exam-result` 진입 시 `clearExamEligibilityCache()` 호출 — 시험이 끝났다는 것 자체가 "이제 응시 대상 아님" 신호
- 강등 이벤트 이후 평가 시점에도 BE eligibility가 false로 바뀌므로 `/feedback` 재마운트에서 자연 갱신

**Why:** 유저가 승급 자격을 얻어도 전용 탭에 안 들어가면 모름. 메인 진입점인 탭바 + 홈 카드에 동시에 강조 신호를 박아야 자연스럽게 유도됨.

---

## 빌드/배포
- `npm run build` 통과 (15 라우트 모두 static 프리렌더, `/level-up/exam-result` 8.39kB 신규 추가)
- `feat/promotion-integration` 브랜치에서 작업 중, PR base는 **dev** (CLAUDE.md 정책: main은 배포 전용)

## 남은 숙제
- BE 평가 응답 `levelDown` 실제 필드명/케이싱 재확인 (현재 camelCase 전제 — 필요 시 lib/api.ts에서 정규화)
- 강등 배너 문구 카피 디벨롭
- 응시 유도 UI는 pulse만 씀 → 포지티브 톤의 glow/sparkle 효과로 톤 차별 검토

## 참조 주석
- **override 패턴**: 원본 값은 건드리지 않고 "덮어쓰기" 키를 따로 두면 원상복구가 쉬움. 셋업 문자열 레벨 원본 + 최신 정수 레벨을 동시에 가지고 있을 수 있음
- **localStorage 플래그 기반 분기**: 라우트 상태를 URL이 아닌 localStorage로 전달하면 URL 공유 시 어긋나지만, 세션 내 짧은 분기에 한해선 기존 네비게이션 재활용하기 쉬움 (exam flow가 정확히 그 케이스)
- **cache-then-network**: `useExamEligibility`처럼 첫 렌더 localStorage → 이후 네트워크 덮어쓰기 패턴은 깜빡임 없이 "느낌상 빠른" UI를 만듦
