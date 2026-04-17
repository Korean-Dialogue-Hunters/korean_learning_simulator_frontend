# CLAUDE.md — 코대헌 (Korean Dialogue Hunters)

## 👤 작업자
- **이름**: 이성준 / **직무**: 프론트엔드 / **수준**: 개발 입문자
- **원칙**: FE 파트 위주 작업. 연계 필요 시 다른 파트 수정 가능.

---

## 🤖 모델 가이드

- **기본**: Sonnet 4.6으로 진행
- **아래 상황이면 작업 시작 전 반드시 알릴 것**:
  > "⚠️ 이 작업은 Opus 권장입니다. `/model` 명령어로 전환 후 진행해주세요."
  - 복잡한 아키텍처 설계
  - 원인 파악 어려운 버그 디버깅
  - 여러 파일에 걸친 리팩토링
---

## 🛠 기술 스택 (FE)
- Next.js 15+ **(App Router 기준)**
- TypeScript
- Tailwind CSS

---

## 📋 내 기능 목록 (우선순위 순)

| 우선순위 | 기능 ID | 기능명 | 핵심 내용 | 상태 |
|----------|---------|--------|-----------|------|
| 🔴 Must | F-HOME | 홈 화면 | TierCard / WeeklyStats / CTA버튼 / BottomTabBar / 재도전카드 / 복습배너 | ✅ 완료 (미완성 기능 🚧 블러 처리) |
| 🔴 Must | F-01 | 맞춤 학습 설정 UI | 웰컴 화면 + 국적(드롭다운+IP자동) / 수준 / 관심문화 / 가보고싶은 곳 | ✅ 완료 |
| 🔴 Must | F-TUT | 튜토리얼 | 기존 스포트라이트 제거, 새 방식 미정 | ⏳ 재설계 대기 |
| 🔴 Must | F-02a | 장소 선택 UI | MVP: 한강만 우선 / 이모지 원형 + 체크 아이콘 | ✅ 완료 |
| 🔴 Must | F-PERSONA | 역할(페르소나) 선택 | 사용자가 맡을 역할/미션 A/B 카드 선택 | ✅ 완료 |
| 🔴 Must | F-03 | 메신저형 채팅 UI | 가로 반반 프로필 + 스트리밍 대화 + 한국어 입력 검증 | ✅ 완료 |
| 🔴 Must | F-04 | 결과 & 점수 화면 | 총점(10점) / 등급(Grade) / 별점 / 레이더 그래프 | ✅ 완료 |
| 🟡 Should | F-05a | 피드백 UI | 오답 빨간 음영 + 대화 요약 + 오답 단어 목록 | ✅ 완료 |
| 🟡 Should | F-05b | 방사형 그래프 | Recharts — 어휘(30%) / 상황(50%) / 문법(20%) | ✅ 완료 |
| 🟡 Should | F-06a | 초성 퀴즈 UI | 주간 복습 페이지 | 🚧 미구현 (페이지 placeholder) |
| 🟡 Should | F-HOME-S | 홈 Should | XP 진행 바 / RetryCard / ReviewBanner | ✅ BE 연동 완료 |
| 🟢 Could | F-05c | Scaffolding 팝업 | AI 발화 클릭 시 어절 단위 한→영 해석 | 미착수 |
| 🟢 Could | F-06b | 플래시 카드 UI | 오답 단어 복습 카드 | ✅ 완료 (별 진척도 연동) |
| 🟢 Could | F-HOME-C | 홈 Could | 카드 페이드인 / 스트릭 토스트 / 스켈레톤 로딩 | 미착수 |
| 🟢 Could | F-LEVELUP | 승급 탭 | Korean Level 승급 시스템 | 🚧 스캐폴드 (BE-T5-02 대기) |

---

## 🖥 화면 구성 (FE 페이지 현황)

```
웰컴 → 맞춤학습설정(/setup) → 홈(/) → 장소선택(/location)
→ 역할선택(/persona) → 채팅(/chat) → 피드백(/feedback) → 결과(/result)

하단 탭: / | /history | /review | /level-up
상단 설정: /settings (톱니바퀴 진입)
```

| 라우트 | 파일 | 상태 | 설명 |
|--------|------|------|------|
| `/` | `app/page.tsx` | ✅ | 홈 화면 (TierCard, WeeklyStats, CTA, 복습배너) |
| `/setup` | `app/setup/page.tsx` | ✅ | 맞춤 학습 설정 (5단계: 초기설정 → 국적 → 닉네임 → 문화 → 한국어 수준) |
| `/settings` | `app/settings/page.tsx` | ✅ | 설정 (언어·테마, 홈 우상단 톱니바퀴 진입) |
| `/location` | `app/location/page.tsx` | ✅ | 장소 선택 (한강·명동·롯데월드·남산 4곳 모두 활성) |
| `/persona` | `app/persona/page.tsx` | ✅ | 역할(페르소나) A/B 선택 |
| `/chat` | `app/chat/page.tsx` | ✅ | 메신저형 채팅 (스트리밍 + 한국어 입력 검증) |
| `/feedback` | `app/feedback/page.tsx` | ✅ | 상세 피드백 (평가 + XP 지급, 메인 결과 화면) |
| `/result` | `app/result/page.tsx` | ✅ | 결과 요약 (총점·등급·레이더·복습 CTA) |
| `/history` | `app/history/page.tsx` | ✅ | 대화 기록 + 별 3개 진척도 (업적·SCK 수집 준비 중) |
| `/review` | `app/review/page.tsx` | ✅ | 주간 복습 (초성퀴즈 + 플래시카드) |
| `/level-up` | `app/level-up/page.tsx` | 🚧 | 승급 탭 스캐폴드 (BE-T5-02 eligibility API 대기) |

---

## 🗺 장소(맵) 정책
- **확정된 장소 목록 없음, 추후 추가 가능**
- MVP 구현 대상: **한강만** 우선 구현
- 장소 버튼은 데이터 배열 기반 동적 렌더링으로 설계 (추가 시 코드 수정 최소화)

---

## 🎨 디자인 토큰 (globals.css 기준)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| background | `#FFFFFF` 화이트 | `#2A2A2A` 소프트 다크 |
| foreground | `#1A1A1A` | `#F5F5F5` |
| accent (CTA/강조) | `#A8D8C8` 민트 | `#D0A95C` 딥 골드 |
| btn-primary-text | `#4A4A4A` 회색 | `#1A1A1A` 다크 |
| card-bg | `#F7F7F7` 연회색 | `#363636` |
| card-border | `#E5E5E5` | `#4A4A4A` |
| surface | `#F0F0F0` | `#333333` |
| tab-active | `#A8D8C8` 민트 | `#D0A95C` 딥 골드 |
| tab-inactive | `#6B6B6B` | `#9CA3AF` |
| setup-accent | `#A8D8C8` 민트 | `#B7933B` |

```
등급(Grade) 컬러 (라이트/다크 동일):
  S    #DC3C3C
  A    #E8672A
  B    #2A8ED8
  C    #888888
```

- 테마 전환: `useTheme` 훅 — `html.dark` 클래스 토글, localStorage 저장
- 기본 테마: 다크 (`layout.tsx`의 inline script로 FOUC 방지)
- setup 화면도 앱 테마(민트/골드)와 통일 (v1.3에서 변경)

---

## 🔗 BE 연계 API (이강산 담당)

> **BE 레포**: `Korean-Dialogue-Hunters/korean_learning_simulator_backend` (FastAPI)
> **상세 매핑**: `docs/API_MAPPING.md` 참조
> **필드 네이밍**: BE snake_case 기준으로 FE 통일 완료 (2026-04-02)

| 화면 | API | FE 타입 | 연동 상태 |
|------|-----|---------|-----------|
| 장소선택→채팅 | `POST /v1/sessions` | `CreateSessionRequest` → `CreateSessionResponse` | ✅ 실연동 |
| 역할선택 | `POST /v1/sessions/{id}/role` | `SelectRoleRequest` → `SessionStateResponse` | ✅ 실연동 |
| 채팅 | `POST /v1/sessions/{id}/turns` | `CreateTurnRequest` → `SessionStateResponse` | ✅ 실연동 |
| 결과+피드백 | `POST /v1/sessions/{id}/evaluation?lang=ko|en` | `EvaluationResponse` | ✅ 실연동 (5축 점수) |
| 홈 프로필 | `GET /v1/users/{nickname}/profile` | `UserProfileResponse` | ✅ 실연동 |
| 홈 통계 | `GET /v1/users/{nickname}/weekly-stats` | `WeeklyStatsResponse` | ✅ 실연동 |
| 홈 복습 | `GET /v1/users/{nickname}/review/count` | `ReviewCountResponse` | ✅ 실연동 |
| 복습 | `GET /v1/users/{nickname}/review/weekly` | `WeeklyReviewResponse` | ✅ 실연동 (페이로드 경량화 T1-03 대기) |
| 기록 | `GET /v1/users/{nickname}/sessions?sort=` | `UserSessionsResponse` | ✅ 실연동 (별 진척도 `chosung_quiz_passed`/`flashcard_done` 포함) |
| 복습 결과 | `POST /v1/users/{nickname}/review/quiz-result` `·/flashcard-result` | `QuizResultResponse` `·FlashcardResultResponse` | ✅ 실연동 |

> IP 기반 국가 감지는 FE에서 ipapi.co 직접 호출로 처리 (BE 불필요)
> XP / streakDays는 FE `localStorage`에서 자체 관리 — `lib/xpSystem.ts`
> 평가 5축: length · vocab · context(scene/mission + relationship) · spelling
> Korean Level(1~6) 승급 시스템은 트랙 5 진행 중 (`docs/TRACK5_BE_REQUESTS.md`)

---

## 📁 FE 프로젝트 구조

```
korean_learning_simulator_frontend/     ← 이 레포 전체 = FE 전권
├── app/                                (페이지 라우트)
│   ├── layout.tsx                      (루트 레이아웃: 480px 모바일 고정 + 테마 스크립트)
│   ├── globals.css                     (Tailwind v4 @theme + 라이트/다크 CSS 변수)
│   ├── page.tsx                        (홈 /)
│   ├── setup/page.tsx                  (맞춤 학습 설정 5단계)
│   ├── settings/page.tsx               (언어·테마 설정 — 홈 톱니바퀴 진입)
│   ├── location/page.tsx               (장소 선택 — 한강·명동·롯데월드·남산)
│   ├── persona/page.tsx                (역할 페르소나 A/B 선택)
│   ├── chat/page.tsx                   (채팅: 스트리밍 + 한국어 검증)
│   ├── feedback/page.tsx               (상세 피드백 — 메인 결과 화면, 평가 호출 + XP 지급)
│   ├── result/page.tsx                 (결과 요약 — 복습 CTA)
│   ├── history/page.tsx                (대화 기록 + 별 3개 진척도)
│   ├── review/page.tsx                 (주간 복습 — 초성퀴즈 + 플래시카드)
│   └── level-up/page.tsx               (승급 탭 🚧 — BE 대기)
├── components/
│   ├── BottomTabBar.tsx                (하단 4탭: 홈/기록/복습/승급)
│   ├── HomeHeader.tsx                  (홈 헤더 — 우상단 설정 톱니바퀴)
│   ├── TierCard.tsx                    (닉네임 + 태권도 벨트(korean_level) + XP 바)
│   ├── WeeklyStats.tsx                 (주간 통계 3칸: 누적 대화 · 평균 · 스트릭)
│   ├── XpGainPopup.tsx                 (대화 완료 시 XP 지급 팝업)
│   ├── chat/                           (채팅 관련 컴포넌트)
│   ├── common/LoadingScreen.tsx        (시나리오/평가/복습 로딩 화면)
│   ├── result/RadarChart.tsx           (Recharts 5축 레이더)
│   ├── review/                         (초성퀴즈 · 플래시카드 UI)
│   └── setup/                          (설정 단계별 컴포넌트)
├── hooks/
│   ├── useChat.ts                      (채팅 상태 + 턴 관리)
│   ├── useSetup.ts                     (설정 프로필 + UUID 기반 userId)
│   └── useTheme.ts                     (다크/라이트 테마)
├── types/
│   ├── api.ts                          (BE API 요청/응답 타입)
│   ├── chat.ts                         (ChatMessage, ChatSession)
│   ├── result.ts                       (ResultData, FeedbackData)
│   ├── setup.ts                        (SetupProfile, LocationId, KoreanLevel 한글 3단계)
│   ├── user.ts                         (UserProfile, WeeklyStats, Grade)
│   └── countries.ts                    (국가 목록)
├── lib/
│   ├── api.ts                          (BE API fetch 래퍼)
│   ├── belt.ts                         (태권도 벨트 6색 — korean_level 매핑)
│   ├── koreanLevel.ts                  (셋업 문자열 ↔ 정수(1~6) 매핑 유틸)
│   ├── xpSystem.ts                     (XP/레벨 진행률 — FE localStorage)
│   ├── designSystem.ts                 (공통 스타일 헬퍼)
│   ├── historyStorage.ts               (evaluation 캐시 + viewSessionId)
│   ├── locationImage.ts · personaImage.ts (정적 이미지 매핑)
│   ├── nicknameGenerator.ts            (닉네임 생성)
│   └── setupValidation.ts              (설정 유효성 검사)
├── public/
│   ├── belts/                          (태권도 벨트 PNG 6장)
│   ├── personas/ · locations/          (인물/장소 SVG)
│   └── locales/{ko,en}.json            (i18n 번역)
├── __tests__/                          (Jest 테스트)
├── docs/                               (CLAUDE.md, PLAN.md, TODO.md, TRACK5_BE_REQUESTS.md, BE_API_CHANGES.md)
└── package.json                        (Next.js 15 + React 19 + Recharts + Lucide)
```

> ⚠️ BE 레포(`korean_learning_simulator_backend`)는 참조만 가능, 수정 금지.
> 간섭/충돌 발생 시 비교 정리해서 이성준에게 알리고 판단 받기.

---

## 🌿 Git 컨벤션

**브랜치 구조**
```
main
└── dev
    └── feat/이성준  ← 내 작업 브랜치 (담당: platform + ui.py 전권)
```

**커밋 메시지 규칙**
```
한글로 짧게 작성 (예: "온보딩 UI 레이아웃 추가", "채팅창 버그 수정")
```

**PR 방법**
```
1. feat/이성준 브랜치에서 작업
2. git push origin feat/이성준
3. GitHub에서 PR 생성 → base: dev / compare: feat/이성준
4. merge 버튼 눌러야 반영됨 (자동 아님)
```

---

## 🔄 문서 우선순위 & 체크

- **문서 우선순위**: `CLAUDE.md` > `docs/PLAN.md` > `docs/TODO.md` > 기획서 원본
- 우리 문서와 기획서 원본이 다를 경우 차이점 정리해서 이성준에게 알리기

- **Pull 할 때마다 체크**:
  1. 새로 생긴 파일, 코드 변경점 파악
  2. 연관 기능/로직/연결이 유기적으로 동작하는지 확인
  3. 문제 있으면 재설계 후 이성준에게 확인 받기

- **코드 작성 전 항상 체크**:
  - 기획(PLAN.md / TODO.md)에 위배되는 부분 없는지
  - 기존 프로젝트 구조에 위배되는 부분 없는지
  - 위배 발견 시 이성준에게 알리기

---

## 🚫 Claude에게 (토큰 절약 지시사항)

- 요청 없이 전체 디렉토리 스캔 금지
- BE/프롬프트 파일은 구조 파악용으로만 참고, 수정 제안은 FE 위주로
- 코드 작성 시 **한국어 주석 필수** (입문자 기준, 블록마다 설명)
- 완벽한 코드보다 **동작하는 MVP 우선** (6주 일정)

---

## 📐 개발 워크플로우 원칙

### 문서 구조
- 기획/계획 → `docs/PLAN.md`
- 할 일 목록 → `docs/TODO.md` (잘게 쪼갠 단위)
- 작업 기록 → `worklog/{000}-{작업내용 한 문장}.md`

### 구현 순서
```
1. TODO 단위로 하나씩 구현 + 개발자 확인
2. 푸시 시점에 해당 푸시에 포함된 작업을 그룹핑해서 worklog 1건 작성
3. 다음 작업으로 이동
```

### worklog 작성 규칙
- **단위: 푸시(push) 1건당 worklog 1개.** TODO 단위가 아님. 한 푸시에 여러 TODO/트랙이 섞여 있어도 하나의 파일에 그룹으로 묶어서 정리
- 파일명: `worklog/{000}-{작업내용 한 문장}.md` 형식 (번호는 순차 증가)
- 필수 포함 항목
  - 푸시 기준 커밋 해시(머지 커밋 기준) + 날짜
  - 작업 범위를 그룹별로 묶어 정리 (예: 트랙별, 기능별)
  - 변경 파일 목록 + 변경 내용 + **왜 이렇게 했는지**
  - 빌드/배포 결과 (`npm run build` 통과 여부, 푸시 여부)
  - 남은 숙제 / 후속 작업
- 일반인이 알기 어려운 기술 용어는 문서 하단에 참조 주석으로 추가
- 파일명 자체는 커밋 메시지로 쓰지 않아도 됨 (커밋 메시지는 별도로 작성)

### 질문 원칙
- 사용자 입장에서 구현 전 한 번 더 생각하고, 의문이 생기면 먼저 질문
- 명령이 모호하거나 용어가 불분명하면 질문하거나 대안 아이디어 제안
- 다른 파트(BE/인프라/프롬프트) 연계나 요구사항이 생기면 정리해서 이성준에게 전달

### TDD 원칙
- 외부 의존성(API 호출, DB 등)이 없는 순수 비즈니스 로직은 TDD로 진행
  - 예: 점수 계산 함수, 초성 변환 로직, 입력값 유효성 검사 등
  - (TDD = 코드보다 테스트를 먼저 작성하는 개발 방식)
