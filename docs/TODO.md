# TODO.md — 코대헌 작업 목록 (재작성 v2)

> **작성 기준**: 2026-04-14, FE/BE 실제 코드 상태 교차 검증 후 재작성
> **작업 단위**: 트랙별 묶음 작업 (이전 1-TODO-1-PR 방식 폐기)
> **워크로그**: 푸시 단위로 작성 (`worklog/{push 단위 한 문장}.md`)
> **디벨롭 필요** 태그: 작업 착수 시점에 초안을 다듬어 진행

---

# 📌 미완료

---

## 🔴 트랙 1 — 즉시 (블로커 / UX 구멍)

- [ ] **T1-01** BE: 신규 유저 자동 생성 — **BE 요청 작성 완료** (`docs/BE_REQUESTS.md` BE-01)
  - 옵션 A(권장): `POST /v1/users` 신설, FE 셋업 완료 시점에 호출
  - 옵션 B: `POST /v1/sessions` 내부 자동 upsert
  - BE 응답 결정 후 FE `lib/api.ts createUser()` + `useSetup.saveProfile()` 호출 추가

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

- [ ] **T1-03** BE: `build_weekly_review` 명시 매핑으로 교체 — **BE 요청 작성 완료** (`docs/BE_REQUESTS.md` BE-02)
  - `review_graph.invoke()` 결과에서 `chosung_quiz`, `flashcards`만 추출
  - `WeeklyReviewResponse` Pydantic 스키마에서 `user_profile`, `just_before_session`, `wrong_word_pool` 3개 필드 제거
  - 페이로드 대폭 축소 (`conversation_log` 전체가 빠짐)
- [ ] **T1-04** FE: BE 정리 후 `types/api.ts WeeklyReviewResponse`에서 `userProfile`, `justBeforeSession`, `wrongWordPool` 제거
- [ ] **T1-05** (보류) review 페이지 `justBeforeSession` 렌더 + 빈 데이터 fallback — BE 정리 결정 후 재검토

---

## 🟢 트랙 4 — 대화 경험 강화

- [ ] **T4-02** 관계유형(relation type) 이미지화 (디벨롭 필요)
  - **메모 (킵)**: 관계 리스트 유한 집합이면 사전 생성 (Midjourney/DALL-E) → 정적 자산. 런타임 LLM 호출은 지연/비용 X
  - 선결: 관계 타입 리스트 확정

---

## 🔵 트랙 5 — Korean Level 시스템 (대형, 별도 PR 트랙)

> ⚠️ 기존 "tier" 개념 폐기 → BE `korean_level` (1~6) 단일 필드로 통합.
> FE에서 "tier" 용어/UI 전부 제거, "Korean Level" 또는 "한국어 레벨"로 교체.

### 데이터 모델
- [ ] **T5-01** BE: `users.korean_level` 필드 (1~6, 정수)
  - BE에서 관리하는 단일 레벨 필드. FE의 기존 tier 관련 코드 제거
- [ ] **T5-02** FE: 셋업 한국어 수준 → `korean_level` 값 매핑
  - Beginner → 1 / Intermediate → 3 / Advanced → 5
  - `useSetup` + `createUser` 호출 시 해당 값 전달
- [ ] **T5-03** FE: 기존 tier UI 제거 + korean level 표시로 교체
  - `TierCard` 등에서 tier 참조 → korean_level 참조로 변경
  - 레벨 표시: 1~6급 (또는 Level 1~6)

### 승급 시스템
- [ ] **T5-04** BE: 승급 자격 판정 API
  - 응시 자격 조건:
    - 현재 korean_level 대화 세션 완료 5회 이상
    - 현재 korean_level 최근 대화 5회 평균 점수 8점 이상
  - FE가 자격 여부를 조회할 수 있는 엔드포인트 필요
- [ ] **T5-05** BE: 승급 시험 엔드포인트
  - 다음 레벨(korean_level + 1) 대화 세션 생성
  - 평가 결과 Grade A 이상 → pass → `korean_level` +1
- [ ] **T5-06** FE: 새 탭 "승급" 추가 (BottomTabBar)
  - 탭 아이콘 + 승급 자격 충족 시 알림 뱃지 (느낌표/말풍선 마크)
  - **자격 미달 화면**: "승급 응시 자격 미달성" 안내 + 남은 조건 표시
  - **자격 충족 화면**: 응시 버튼 + 현재 레벨 → 다음 레벨 안내
  - 승급 시험 = 다음 레벨 대화 세션 진행 → 결과에서 pass/fail 표시
- [ ] **T5-07** 보류: SCK 단어퀴즈 (현재 등급에 맞는 SCK 어휘 테스트)
- [ ] **T5-08** 보류: 플래시카드(내 오답) 어휘 퀴즈

### 레벨 재조정 (강등)
> **목적**: 셋업에서 유저가 선택한 레벨과 실제 실력이 맞지 않을 때 정상화
> **데이터 근거**: 기존 수집 중인 대화 로그 + 평가 데이터 기반으로 계산

- [ ] **T5-09** BE: 강등 판정 로직
  - 현재 korean_level 최근 대화 3회 평균 점수 5점 이하 → `korean_level` -1
  - 레벨 변경(승급/강등) 시 평균 측정 리셋 (변경 시점부터 재집계)
- [ ] **T5-10** FE: 강등 알림 UI
  - 레벨 변경 감지 시 모달/토스트로 안내

---

## 🟣 트랙 6 — 기록 탭 세션 진척도

> 기록 탭의 대화 세션 카드마다 "완벽 완수" 여부를 3가지 항목으로 측정·표시

### 진척도 3항목
1. **대화 Grade A 획득** — 평가 결과에서 Grade가 A 이상
2. **초성퀴즈 4/5점 이상** — 해당 세션의 주간 복습 초성퀴즈 점수
3. **플래시카드 완료** — 5장 모두 "암기 완료" 누르고 넘어가기

- [ ] **T6-01** BE: 세션별 진척도 데이터 제공
  - 각 세션에 대해 위 3항목 달성 여부를 조회할 수 있는 API (또는 기존 응답에 포함)
  - 대화 로그 + 평가 데이터 기반으로 산출
- [ ] **T6-02** FE: 기록 카드에 진척도 표시
  - **메모 (킵) — UI 후보**:
    - 별 3개 ⭐⭐⭐ (게임적, 친숙) — **추천**
    - 트로피 + 점 3개
    - 3분할 진행바 ▰▰▱
    - 체크박스 3개
    - 도넛 차트
  - 추천 초안: 별 3개 + 호버/탭 시 툴팁 (각 별이 무엇인지)
  - 각 별: ① Grade A ② 초성퀴즈 4/5+ ③ 플래시카드 완료

---

## 🔵 트랙 7 — 문서 정합성

- [ ] **T7-01** `docs/CLAUDE.md` 갱신
  - 라우트 표 (`/history` `/review` 상태 갱신, `/profile` 삭제 반영)
  - "BE 연계 API ⏳ mock" 표 → 실연동 상태로 갱신
  - 레이더 그래프 축수 (3축 → 5축)

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
