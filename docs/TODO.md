# TODO.md — 코대헌 작업 목록 (재작성 v2)

> **작성 기준**: 2026-04-14, FE/BE 실제 코드 상태 교차 검증 후 재작성
> **최근 갱신**: 2026-04-17 (2차) — T5-06 자격 시각화 + T6-03 별 폴백/아이콘 + T8 리뷰 스코프(Option A) + 홈/결과 UI 다듬기
> **작업 단위**: 트랙별 묶음 작업 (이전 1-TODO-1-PR 방식 폐기)
> **워크로그**: 푸시 단위로 작성 (`worklog/{push 단위 한 문장}.md`)
> **디벨롭 필요** 태그: 작업 착수 시점에 초안을 다듬어 진행

---

# 📌 미완료

---

## 🔴 트랙 1 — 즉시 (블로커 / UX 구멍)

### T1 그룹: BE `WeeklyReviewResponse` 응답 경량화

> **배경**: `GET /v1/users/{nickname}/review/weekly` 응답이 LangGraph `ReviewState` 덤프 그대로 노출되어 FE가 안 쓰는 필드 다수 포함. `build_weekly_review`(`learning_orchestrator.py:598,606`)가 `review_graph.invoke()` 결과를 거의 그대로 반환하는 구조를 명시 매핑으로 교체.

**필드별 진단**

| 필드 | 성격 | FE 필요 | 조치 |
|---|---|---|---|
| `userProfile` | 그래프 입력값 누수 | ❌ | 제거 |
| `justBeforeSession` | 그래프 입력값 누수 + `conversation_log` 전체 포함 (페이로드 무거움) | ❌ | 제거 (또는 `sessionId`만) |
| `wrongWordPool` | 중간 산출물 누수 (FE는 flashcards에 교정 결과 이미 들어옴) | ❌ | 제거 |
| `chosungQuiz` | 최종 산출물 | ✅ | 유지 |
| `flashcards` | 최종 산출물 | ✅ | 유지 |

**상세 노트**
- `userProfile`: 그래프 내부 노드들이 한국어 수준 참조용으로 `ReviewState`에 넣어둔 입력값. `learning_orchestrator.py:616 _persist_review_artifacts`에서 `session_state["user_profile"]` 그대로 복사. 응답 노출은 `review_graph.invoke(state)`가 입력 상태 포함 dict 반환하기 때문.
- `justBeforeSession`: 이름은 list지만 항상 원소 1개. `generate_flashcards.py:225`(명사 토크나이징), `generate_chosung_quiz.py:500`(퀴즈 소재), `ui.py:444`(Gradio weak_count 표시)에서 내부 사용. `conversation_log` 전체가 들어가 페이로드 큼.
- `wrongWordPool`: 평가 그래프가 만든 "틀린→교정" 쌍. `generate_flashcards.py:253`에서 LLM 교정 경로 분기용 플래그로만 사용. 실제 데이터는 `just_before_session[0].wrong_words`에서 다시 파싱하므로 중복.
- `chosungQuiz` / `flashcards`: 의도된 최종 산출물. 유지.

- [ ] **T1-03** BE: `build_weekly_review` 명시 매핑으로 교체
  - `review_graph.invoke()` 결과에서 `chosung_quiz`, `flashcards`만 추출
  - `WeeklyReviewResponse` Pydantic 스키마에서 `user_profile`, `just_before_session`, `wrong_word_pool` 3개 필드 제거
  - 페이로드 대폭 축소 (`conversation_log` 전체가 빠짐)
- [ ] **T1-04** FE: BE 정리 후 `types/api.ts WeeklyReviewResponse`에서 `userProfile`, `justBeforeSession`, `wrongWordPool` 제거
- [ ] **T1-05** (보류) review 페이지 `justBeforeSession` 렌더 + 빈 데이터 fallback — BE 정리 결정 후 재검토

---

## 🟣 트랙 8 — 리뷰 스코프(세션 단위) 정합성

> **배경**: 홈 복습 배너에 초성퀴즈가 31개씩 누적되는 버그 발견. 추적 결과 BE `_build_review_base_state`가 **유저 전체 세션**을 소재로 잡아 복습 콘텐츠를 계산(퀴즈/카드가 과거 기록 통째로 뭉쳐 재생성). 반면 `_persist_review_artifacts`는 단일 세션 기준이라 저장은 맞음 → 조회 경로만 깨진 형태.
> **결정**: BE Option A 채택 — `/review/weekly?sessionId=X` 쿼리 허용하여 DB에 저장된 해당 세션 산출물만 반환(LLM 재실행 없이). 2026-04-17 BE 작업 시작.

- [ ] **T8-01** BE: `GET /v1/users/{nickname}/review/weekly?sessionId=X` 지원
  - `history_stars` 저장 시점 아티팩트(초성퀴즈/플래시카드) DB 조회 경로 추가
  - 미지정 시 기존 동작(주간 전체 생성) 유지
- [x] **T8-02** FE: `getWeeklyReview(userId, sessionId?)` 시그니처 확장 ✅ 2026-04-17
  - `lib/api.ts`에서 `sessionId` 옵셔널 쿼리로 전달
  - `/review` 페이지가 `viewSessionId` 기반으로 sessionId 전달 (BE가 아직 무시해도 동작에 문제 없음)
- [x] **T8-03** FE: 리뷰 세션 덮어쓰기 제거 ✅ 2026-04-17
  - 과거 `startMode()`에서 `data.justBeforeSession[0].sessionId`로 state를 덮어써 별 저장 대상이 엇갈리던 버그 제거
  - 별 저장은 `collectStarSessionIds()`로 URL/state/localStorage 후보 전부에 기록해 폴백 방어
- [x] **T8-04** FE: 리뷰 진입 맥락 구분 ✅ 2026-04-17
  - 결과페이지→초성퀴즈 진입 시 완료 버튼 라벨 "결과 페이지로", 복습 탭 진입 시 "복습 목록으로" (`review.backToResult` 키 추가)
  - `ChosungQuizView`에 `fromResult` prop 전달, 라벨 분기
- [x] **T8-05** FE: 홈 복습 배너 카피 ✅ 2026-04-17
  - "주간 복습 준비됐어요!" → "복습 컨텐츠 준비됐어요!"
  - `N개 / N장` 카운트 제거 (누적 버그 혼란 + BE Option A 이후 숫자가 세션 기준으로 바뀜)
  - `getReviewCount` 호출 제거

---

## 🔵 트랙 5 — Korean Level 시스템 (대형, 별도 PR 트랙)

> ⚠️ 기존 "tier" 개념 폐기 → BE `korean_level` (1~6) 단일 필드로 통합.
> FE에서 "tier" 용어/UI 전부 제거, "Korean Level" 또는 "한국어 레벨"로 교체.
> **BE 현황 재검증**: 2026-04-17 — 상세 `docs/TRACK5_BE_REQUESTS.md`

### 승급 시스템 (남은 BE 작업)
- [ ] **T5-04** BE: 승급 자격 판정 API → TRACK5 `BE-T5-02`
  - `GET /v1/users/{user_nickname}/level-up/eligibility`
  - 응시 자격: 현재 레벨에서 세션 5회+ & 최근 5회 평균 ≥ 8점
  - 헬퍼 이미 존재(`get_sessions_by_user`, `get_average_score_by_user`) — `korean_level` 필터만 추가
- [ ] **T5-05** BE: 승급 시험 엔드포인트 → TRACK5 `BE-T5-03`
  - `POST /v1/users/{nickname}/level-up/exam` + `/result`
  - `exam_orchestrator` 스캐폴드 있으나 `continue_turn` 미구현 + 라우터 미노출
  - 다음 레벨 대화 세션 생성 → Grade A+ (기준 논의 필요) → `korean_level +1`

### 레벨 재조정 (강등)
- [ ] **T5-09** BE: 강등 판정 로직 → TRACK5 `BE-T5-04`
  - 현재 레벨 최근 3회 평균 ≤ 5점 → `korean_level -1`
  - 평가 시점 자동 판정 + `EvaluationResponse`에 `level_changed`, `new_level` 필드 추가 (권장)
  - 레벨 변경 시 평균 측정 리셋

### FE 진행 중 / 대기
- [~] **T5-06** FE: 새 탭 "승급" — **자격 시각화 완료** 2026-04-17 (2차)
  - 1차: `/level-up` 페이지 + 4번째 탭 + i18n 추가 (비활성 응시 버튼)
  - 2차: 자격 조건 3종(세션 5+ / 평균 8점+ / 시험 Grade A+) 시각화
    - `getUserSessions` + `getAverageScore` 로컬 계산 → eligibility 판정
    - 조건별 진행도 텍스트(`reqSessionsProgress`, `reqScoreProgress`) + 시험 상태(`reqExamPending`/`reqExamLocked`) + 전체 뱃지(`eligibleBadge`/`notEligibleBadge`) 표시
    - 최대 레벨(6) 도달 시 `maxLevelNote` 안내
    - 홈 TierCard 벨트 탭 → `/level-up` 라우팅
  - 남은 숙제 (BE 연동 후):
    - eligibility API 조회로 로컬 계산 대체 (BE-T5-02 확정 후)
    - 자격 충족 시 응시 버튼 활성화 + 탭 뱃지
    - 시험 세션 생성/결과 플로우 (`/chat` 연동)
- [ ] **T5-10** FE: 강등 알림 UI — BE-T5-04 `level_changed`/`new_level` 필드 확정 후
  - `/feedback` 평가 응답 감지 → 모달/토스트 표시
  - `EvaluationResponse` 타입에 옵셔널 필드 추가

### 보류
- [ ] **T5-07** SCK 단어퀴즈 (현재 등급에 맞는 SCK 어휘 테스트)
- [ ] **T5-08** 플래시카드(내 오답) 어휘 퀴즈

---

## 🔵 트랙 7 — 문서 정합성 (나머지)

<!-- T7-01 완료 → 완료 섹션으로 이동 -->
<!-- 추후 신규 문서 정합성 항목 여기에 추가 -->

---

## ⚪ 보류

- 진행률 애니메이션 (T4-01 결론에 따라)
- F-05c Scaffolding 팝업 (AI 발화 어절 단위 한→영 해석)
- F-HOME-C 페이드인 / 스트릭 마일스톤 토스트 / 스켈레톤 로딩
- F-TUT 튜토리얼 재설계 (기존 스포트라이트 제거됨, 새 방식 미정)
- 홈 재도전 카드 BE 엔드포인트 + 블러 해제 (현재 blur+🚧)
- `/history` 업적 / SCK 수집 탭 (현재 placeholder)

---

# ✅ 완료

---

## 🔴 트랙 1 — 즉시 (블로커 / UX 구멍)

- [x] **T1-02** FE: `/history` 404 → empty state fallback ✅ (`app/history/page.tsx` catch에서 404 / "user profile not found" 감지 시 records=[]로 처리)

---

## 🟡 트랙 2 — UI 디테일 (묶음 PR) ✅ 완료 (2026-04-14)

- [x] **T2-01** 셋업 한국어 수준 화면 — `LevelSelect.tsx`: 중급/고급 disabled, 태그/카피/버튼 크기 ↑
- [x] **T2-02** 결과↔피드백 흐름 스왑 — 채팅 종료 → `/feedback` (평가 호출 + XP 지급) → "결과 요약 보기" → `/result`
- [x] **T2-03** 결과 LLM 피드백 i18n — `evaluateSession(sessionId, lang)` 추가, `?lang=ko|en` 쿼리 전달
  - **BE 확인 요청**: 백엔드가 `?lang=` 쿼리를 받아 `feedback`/`llm_summary`를 해당 언어로 생성하는지 점검 필요 (FE는 ko/en 두 값만 보냄)
- [x] **T2-04** 결과 페이지 대화 로그 카드에 mission + scene 표시 (한/영 분기, `myPersona` + `scene`/`sceneEn`)
- [x] **T2-05** 레이더 격자 4링 → 3링 (`ticks={[3.33, 6.67, 10]}`)
- [x] **T2-06** SCK 어휘 사용 → `/feedback`로 이동 (피드백이 메인 결과 화면이 됨)
- [x] **T2-07** TierCard 줄바꿈 — `{닉네임}님` / `환영해요!` (locale `tierCard.namePostfix` + `tierCard.welcome` 분리)
- [x] **T2-08** 초성퀴즈 가독성 — 지시문 헤더 + 초성 강조 박스(5xl) + 의미 보조
- [x] **T2-09** 플래시카드 마지막 카드 "다음" → "암기 완료" (`review.memorizeBtn`)

---

## 🔵 트랙 5 — 데이터 모델 (부분 완료, 2026-04-17)

> BE `korean_level` 정수화는 재검증 결과 이미 완료 상태로 확인됨 (`docs/TRACK5_BE_REQUESTS.md` §1).

- [x] **T5-01** BE: `user_profile.korean_level` 정수(1~6) 필드 ✅ 이미 반영
  - `UserProfileRecord` (`models.py:101`) + `UserProfileResponse` (`schemas/user.py:29`) 모두 `int`
  - `session.korean_level` 도 `Literal[1,2,3,4,5,6]` 정수 저장 (`models.py:15`)
- [x] **BE-T5-06** BE: `CreateSessionRequest` 정수/문자열 양쪽 수용 ✅ 이미 반영
  - `schemas/session.py:123–159` `normalize_korean_level` 밸리데이터가 `초급/중급/고급/Beginner/.../1~6/1급~6급` → 1~6 정수 정규화
  - FE는 현재 문자열 전송 중, 동작 무문제. 추후 정수 전환은 선택 사항
- [x] **T5-02** FE: 셋업 한국어 수준 → `korean_level` 값 매핑 ✅ 2026-04-17
  - `lib/koreanLevel.ts` 신설 — `KOREAN_LEVEL_MAP`, `mapKoreanLevel`, `normalizeKoreanLevel`
  - `UserProfileResponse.koreanLevel` 타입을 `string | number`로 확장
- [x] **T5-03** FE: 기존 tier UI 제거 + korean level 표시로 교체 ✅ 2026-04-17
  - TierCard는 이미 `lib/belt.ts` (태권도 벨트 1~6급) 기반
  - Dead i18n 키 `tierCard.nextTier` 제거

---

## 🟣 트랙 6 — 기록 탭 세션 진척도 ✅ 완료 (2026-04-17, 2차 보강)

- [x] **T6-01** BE: 세션 진척도 데이터 제공 — `history_stars` 테이블 + `POST /v1/users/{nickname}/review/quiz-result`, `POST .../review/flashcard-result` (자세한 내용은 `docs/BE_API_CHANGES.md`)
- [x] **T6-02** FE: 기록 카드 별 3개 진척도 + 복습 결과 저장
  - ① 대화 완료 ② 초성퀴즈 4/5+ ③ 플래시카드 전체 완료
  - `UserSessionItem`에 `chosungQuizPassed`, `flashcardDone` 추가, 실제 BE 데이터 사용
  - 리뷰 탭: 별 미완료 최저점 세션을 자동 타겟 → 퀴즈/카드 완료 시 BE에 결과 전송
  - 퀴즈/플래시카드 모두 완료 시 "모든 복습 완료" 화면 표시
  - 기록 → 결과 진입 시 뒤로가기 버튼 추가
- [x] **T6-03** FE: 별 진척도 폴백 + 아이콘/임계값 정리 ✅ 2026-04-17 (2차)
  - `lib/starStorage.ts` 신설 — BE 별 필드 응답 전까지 localStorage에 `markQuizPassed`/`markFlashcardDone` 기록해 즉시 UI 반영
  - `toProgress()` 우선순위: BE 필드 → `getStarProgress(sessionId)` 폴백
  - `lib/api.ts` `getUserSessions` snake_case→camelCase 정규화 블록 유지(BE가 camel 미포함 시 방어)
  - 초성퀴즈 임계값 **4/5(80%)** → **75%** (types/api.ts 주석 통일)
  - 대화완료 별 아이콘: `Check` → `MessageCircle` (홈에서 사용하는 말풍선 아이콘과 일치)
- [x] **번외** 장소 모두 활성화 + 남산 추가
- [x] **번외 2** 결과 페이지 상단 라벨 ✅ 2026-04-17 (2차)
  - 기존 "Beginner" 정적 라벨 → 유저 `korean_level` 기반 **벨트 이름**(`belt.nameKo + 띠` / `belt.name Belt`) + 벨트 색 적용
- [x] **번외 3** 결과 페이지 "목록으로" 뒤로가기 ✅ 2026-04-17 (2차)
  - 기록 탭에서 결과 진입 시 상단 Back 버튼이 `result.backToHistory`("목록으로")로 바뀌어 `/history` 복귀 (일반 진입에서는 기존 동작 유지)

---

## 🟠 트랙 3 — 설정 메뉴 + 셋업 재구성 ✅ 완료 (2026-04-14)

- [x] **T3-01** `/settings` 페이지 신설 (`app/settings/page.tsx`) — 홈 우상단 톱니바퀴(`HomeHeader.tsx`)에서 진입
- [x] **T3-02** 언어/테마 토글 `/settings`로 통합 — `HomeHeader`, `WelcomeScreen`에서 `LanguageSelector`/`ThemeToggle` 제거
- [x] **T3-03** 셋업 1단계 = "초기 설정" 신설 (`InitialSettingsStep.tsx`, 언어+테마 토글 즉시 반영)
- [x] **T3-04** `/profile` 라우트 + BottomTabBar 탭 삭제 (3탭 구성: 홈/기록/복습)
- [x] **T3-05** 셋업 장소 단계 삭제 → 5단계 재배치 (1 초기설정 / 2 국적 / 3 닉네임 / 4 문화 / 5 한국어 수준). 마지막 단계 후 `StartConfirmModal` ("지금 바로 대화 시작?") → 네 `/location`, 아니오 `/`. 셋업 내부 `createSession` 호출 제거
- [x] **T3-06** 홈 빈 상태 CTA 카드 (재도전 카드 자리, 활성 세션 없을 때만) + "새로 하기" 버튼 펄스 애니메이션 (`animate-pulse` + glow ring)

---

## 🟢 트랙 4 — 대화 경험 강화

- [x] **T4-01** 로딩화면 시스템 ✅ 2026-04-14
  - 채택안: ①(메시지 회전) + ③(브랜드 스피너) + 깜빡임 방지(delay 200ms / minVisible 500ms)
  - `components/common/LoadingScreen.tsx` 신설 — `active` prop 기반, variant: scenario/evaluation/review, 메시지 2.5s 회전
  - i18n `loading.scenario|evaluation|review` 메시지 3개씩 (ko/en)
  - 적용: `/location` (시나리오), `/result` `/feedback` (평가), `/review` 3곳
  - 미사용 `ScenarioLoading.tsx` 삭제
- [x] **T4-03** 역할(persona) 선택 화면 리디자인 ✅ 2026-04-14
  - 세로 평행 → 가로 평행(상하 스택) 큰 카드 2개, 배경 이미지 + 그라데이션 + 좌하단 텍스트 + A/B 배지
  - 카드 탭 → `PersonaDetailModal` 풀스크린: 큰 인물 이미지 + 관계 헤더(내 역할 → 상대) + 정보/미션/시나리오 + 하단 CTA
  - "선택 강조" 단계 제거 (탭=즉시 디테일 진입)
  - 임시 SVG: `public/personas/{a,b}/1.svg` (실제 견본 이미지 다중 매핑은 향후)
  - `lib/personaImage.ts` 헬퍼 — `avatarUrl` 우선, 폴백 `/personas/{id}/1.svg`
  - i18n: `persona.relationLabel/youAre/partnerIs/missionLabel/infoLabel/tapToView/ageUnit`
  - **연관**: BE-04 (페르소나/시나리오 영문 필드) 요청 등록
- [x] **T4-04** 맵 선택 화면 배경 이미지 + 카드 리디자인 ✅ 2026-04-14
  - 임시 SVG 3장 (`public/locations/{hangang,myeongdong,lotteworld}.svg`) — 그라데이션 + 일러스트
  - `lib/locationImage.ts` 헬퍼 — 향후 실제 사진 덮어쓰기
  - `/location` 카드 리디자인 — 배경 이미지 + 하단 그라데이션 + 좌하단 텍스트, 비활성 그레이스케일
  - 화면 꽉차게 (스크롤 X): `h-screen overflow-hidden` + 카드 `flex-1 min-h-0` 균등 분할
  - **UX 변경**: "Start here" 확인 버튼 제거 → 카드 탭 즉시 세션 생성 (선택 강조 단계 삭제)

---

## 🔵 트랙 7 — 문서 정합성

- [x] **T7-01** `docs/CLAUDE.md` 갱신 ✅ 2026-04-17
  - 라우트 표: `/profile` 제거, `/settings`·`/level-up` 추가, 상태 갱신
  - BE 연계 API 표: `⏳ mock` → `✅ 실연동`, 기록/복습 결과 엔드포인트 추가
  - 기능 목록 표: F-PROFILE → F-LEVELUP으로 교체, F-06b/F-HOME-S 완료 반영
  - 프로젝트 구조: belt.ts · koreanLevel.ts · 4탭 BottomTabBar · public/belts 반영
- [x] **T7-02** 루트 `TODO.md` (BE WeeklyReviewResponse 정리 노트)를 `docs/TODO.md`로 흡수 → 루트 파일 삭제 완료

---

## 🗑️ 구 TODO에서 삭제된 항목 (참고용)

- 50-51 "3축" — 실제 5축
- A-01~A-08 BE 연동 표 — 대부분 완료
- F-06a 52~55 — 이미 완료
- F-06b 62~64 — 이미 완료
- F-PROFILE 68~70 — 탭 삭제 결정 (T3-04)
- F-HOME-S 56 XP 진행 바 애니메이션 — 사용자 제외 결정
- 09-1/09-2/57/59 "🚧 블러" 문구 — 현재 상태로 갱신됨

---

## 📝 작업 규칙

- 트랙 단위로 묶음 작업 진행
- 푸시 단위로 워크로그 작성 (`worklog/{푸시 한 문장}.md`)
- 디벨롭 필요 항목은 작업 착수 시점에 메모(킵)된 초안을 다듬어 시작
- main 머지 전 항상 `npm run build` 통과 확인 (CLAUDE.md 규칙)
- BE 레포 수정 필요 시 사용자에게 확인 후 진행
