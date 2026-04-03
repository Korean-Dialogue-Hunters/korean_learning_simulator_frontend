# API_SPEC.md — 코대헌 BE API 명세

> **Base URL**: `/v1`
> **BE 프레임워크**: FastAPI + LangGraph
> **BE 레포**: `Korean-Dialogue-Hunters/korean_learning_simulator_backend`
> **FE 타입 정의**: `types/api.ts`, `types/user.ts`, `types/setup.ts`, `types/result.ts`, `types/chat.ts`

---

## 네이밍 규칙

| 구분 | 형식 | 예시 |
|------|------|------|
| **BE 필드명** (JSON 전송) | `snake_case` | `user_nickname`, `session_id` |
| **FE 필드명** (TypeScript) | `camelCase` | `userNickname`, `sessionId` |

> **연동 시 주의**: BE API와 실제 통신 시 camelCase ↔ snake_case 변환 레이어(변환 함수 or axios interceptor) 필요.
> 각 필드 설명에 `BE: snake_name` 주석으로 BE 원본 필드명 표기.

---

## 1. 세션 생성

대화 시작 시 사용자 프로필을 보내고, 시나리오 + 페르소나 2명을 생성받는다.

```
POST /v1/sessions
```

### Request Body

FE 타입: `CreateSessionRequest`

| FE 필드 | BE 필드 | 타입 | 필수 | 설명 | 예시 |
|---------|---------|------|------|------|------|
| `userNickname` | `user_nickname` | `string` | O | 사용자 닉네임 | `"빛나는별"` |
| `country` | `country` | `string` | O | 국적 (ISO 국가코드) | `"US"` |
| `koreanLevel` | `korean_level` | `string` | O | 한국어 수준 | `"초급"` \| `"중급"` \| `"고급"` |
| `culturalInterest` | `cultural_interest` | `string` | O | 관심 한국 문화 | `"K-Pop"` \| `"K-Content"` \| `"K-Beauty"` \| `"K-Food"` \| `"K-Gaming·eSports"` \| `"Others"` |
| `location` | `location` | `string` | O | 대화 장소 | `"hangang"` |

```json
// FE → BE 전송 시 (snake_case로 변환 필요)
{
  "user_nickname": "빛나는별",
  "country": "US",
  "korean_level": "초급",
  "cultural_interest": "K-Pop",
  "location": "hangang"
}
```

### Response Body

FE 타입: `CreateSessionResponse`

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `sessionId` | `session_id` | `string` | 세션 고유 ID |
| `scenarioTitle` | `scenario_title` | `string` | 시나리오 제목 |
| `scene` | `scene` | `string` | 시나리오 상세 설명 |
| `personas` | `personas` | `Record<string, Persona>` | 선택 가능한 역할 2명 (`{ "A": {...}, "B": {...} }`) |
| `relationshipType` | `relationship_type` | `string` | 관계 유형 (예: `"처음 만난 사이"`) |
| `dialogueFunction` | `dialogue_function` | `string` | 대화 기능 (예: `"길 묻기"`) |
| `turnLimit` | `turn_limit` | `number` | 최대 턴 수 |
| `location` | `location` | `string` | 대화 장소 |
| `userProfile` | `user_profile` | `Record<string, unknown>` | 요청한 사용자 정보 그대로 반환 |

#### `Persona` 객체

| FE 필드 | BE 필드 | 타입 | 설명 | 예시 |
|---------|---------|------|------|------|
| `id` | `id` | `"A"` \| `"B"` | 페르소나 식별자 | `"A"` |
| `name` | `name` | `string` | 이름 | `"지현"` |
| `age` | `age` | `number` | 나이 | `25` |
| `gender` | `gender` | `string` | 성별 | `"여성"` |
| `role` | `role` | `string` | 역할 | `"대학생"` |
| `mission` | `mission` | `string` | 사용자가 수행할 미션 | `"한강 자전거길을 달리다 길을 잃어 도움을 요청하는 대학생"` |
| `avatarUrl` | `avatar_url` | `string?` | 프로필 이미지 URL (선택) | — |

---

## 2. 역할 선택

사용자가 페르소나 A 또는 B를 선택한다. 선택하지 않은 쪽이 AI 상대방이 된다.

```
POST /v1/sessions/{session_id}/role
```

### Path Parameter

| 이름 | 설명 |
|------|------|
| `session_id` | 세션 ID (1번 응답 `sessionId`) |

### Request Body

FE 타입: `SelectRoleRequest`

| FE 필드 | BE 필드 | 타입 | 필수 | 설명 |
|---------|---------|------|------|------|
| `selectedRole` | `selected_role` | `string` | O | 사용자가 맡을 역할 (`"A"` 또는 `"B"`) |

```json
// FE → BE 전송 시
{ "selected_role": "A" }
```

### Response Body

FE 타입: `SessionStateResponse` (역할 선택·턴 진행·세션 조회 공통)

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `sessionId` | `session_id` | `string` | 세션 고유 ID |
| `scenarioTitle` | `scenario_title` | `string` | 시나리오 제목 |
| `scene` | `scene` | `string` | 시나리오 설명 |
| `personas` | `personas` | `Record<string, Persona>` | 페르소나 정보 |
| `relationshipType` | `relationship_type` | `string` | 관계 유형 |
| `dialogueFunction` | `dialogue_function` | `string` | 대화 기능 |
| `turnLimit` | `turn_limit` | `number` | 최대 턴 수 |
| `location` | `location` | `string` | 대화 장소 |
| `userProfile` | `user_profile` | `Record<string, unknown>` | 사용자 프로필 |
| `selectedRole` | `selected_role` | `string` | 선택된 역할 |
| `conversationLog` | `conversation_log` | `ConversationEntry[]` | 전체 대화 로그 |
| `turnCount` | `turn_count` | `number` | 현재까지 진행된 턴 수 |
| `isFinished` | `is_finished` | `boolean` | 대화 종료 여부 |
| `latestAiResponse` | `latest_ai_response` | `string` | AI의 최신 응답 텍스트 |

#### `ConversationEntry` 객체

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `speaker` | `speaker` | `"user"` \| `"ai"` | 발화자 |
| `role` | `role` | `string` | 페르소나 역할명 |
| `name` | `name` | `string` | 페르소나 이름 |
| `utterance` | `utterance` | `string` | 발화 내용 |

---

## 3. 턴 진행

사용자 발화를 보내고 AI 응답을 받는다.

```
POST /v1/sessions/{session_id}/turns
```

### Path Parameter

| 이름 | 설명 |
|------|------|
| `session_id` | 세션 ID |

### Request Body

FE 타입: `CreateTurnRequest`

| FE 필드 | BE 필드 | 타입 | 필수 | 설명 |
|---------|---------|------|------|------|
| `userInput` | `user_input` | `string` | O | 사용자 발화 텍스트 |

```json
// FE → BE 전송 시
{ "user_input": "안녕하세요! 자전거 빌리고 싶어요." }
```

### Response Body

`SessionStateResponse` (2번과 동일)

> `conversationLog`에 사용자+AI 발화 추가, `turnCount` 증가.
> `isFinished === true`면 대화 종료 → 평가 API 호출 가능.

### FE 입력 제한사항 (`components/chat/ChatInput.tsx`)

| 항목 | 값 | 설명 |
|------|-----|------|
| 최대 바이트 | `1000` | 초과 시 전송 차단 |
| 한국어 검증 | 필수 | 한글 미포함 입력 시 경고 + 전송 차단 |

---

## 4. 평가

대화 종료 후 AI가 전체 대화를 평가한다.

```
POST /v1/sessions/{session_id}/evaluation
```

### Path Parameter

| 이름 | 설명 |
|------|------|
| `session_id` | 세션 ID |

### Request Body

없음 (세션 ID만으로 평가 수행)

### Response Body

FE 타입: `EvaluationResponse`

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `sessionId` | `session_id` | `string` | 세션 고유 ID |
| `conversationLog` | `conversation_log` | `ConversationEntry[]` | 전체 대화 로그 |
| `location` | `location` | `string` | 대화 장소 |
| `scenarioTitle` | `scenario_title` | `string` | 시나리오 제목 |
| `highlightedLog` | `highlighted_log` | `HighlightedEntry[]` | 오답 하이라이트 포함 대화 로그 |
| `totalScore10` | `total_score_10` | `number` | 총점 (0~10) |
| `grade` | `grade` | `string` | 등급 (예: `"Bronze"`) |
| `feedback` | `feedback` | `string` | 전체 피드백 텍스트 |
| `llmSummary` | `llm_summary` | `string` | 한 줄 요약 |
| `sckMatchCount` | `SCK_match_count` | `number` | SCK 어휘 일치 단어 수 |
| `sckTotalTokens` | `SCK_total_tokens` | `number` | SCK 전체 토큰 수 |
| `sckMatchRate` | `SCK_match_rate` | `number` | SCK 일치율 (0~1) |
| `sckLevelCounts` | `SCK_level_counts` | `Record<string, number>` | SCK 급수별 발생 횟수 |
| `sckLevelWordCounts` | `SCK_level_word_counts` | `Record<string, string[]>` | SCK 급수별 사용 단어 |

#### `HighlightedEntry` 객체

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `speaker` | `speaker` | `string` | 발화자 |
| `text` | `text` | `string` | 원문 텍스트 |
| `highlight` | `highlight` | `string` | 오류 설명 |

---

## 5. 유저 프로필

홈 화면 `HomeHeader`, `TierCard`에서 사용.

```
GET /v1/users/{user_nickname}/profile
```

### Path Parameter

| 이름 | 설명 |
|------|------|
| `user_nickname` | 사용자 닉네임 |

### Response Body

FE 타입: `UserProfile`

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `userNickname` | `user_nickname` | `string` | 닉네임 |
| `grade` | `latest_grade` | `Grade` | 최근 등급 |
| `xp` | — | `number` | **FE 전용** (BE 미제공) |
| `xpMax` | — | `number` | **FE 전용** (BE 미제공) |
| `xpToNext` | — | `number` | **FE 전용** (BE 미제공) |
| `avatarUrl` | — | `string?` | **FE 전용** (BE 미제공) |

---

## 6. 주간 통계

홈 화면 `WeeklyStats` 컴포넌트에서 사용.

```
GET /v1/users/{user_nickname}/weekly-stats
```

### Path Parameter

| 이름 | 설명 |
|------|------|
| `user_nickname` | 사용자 닉네임 |

### Response Body

FE 타입: `WeeklyStats`

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `conversationCount` | `conversation_count` | `number` | 누적 대화 횟수 |
| `averageScore` | `average_score` | `number` | 평균 점수 (0~10) |
| `streakDays` | — | `number` | **FE 전용** (BE 미제공) |

---

## 7. 복습 카운트

홈 화면 복습 배너에서 사용.

```
GET /v1/users/{user_nickname}/review/count
```

### Path Parameter

| 이름 | 설명 |
|------|------|
| `user_nickname` | 사용자 닉네임 |

### Response Body

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `chosungQuizCount` | `chosung_quiz_count` | `number` | 초성 퀴즈 문제 수 |
| `flashcardCount` | `flashcard_count` | `number` | 플래시 카드 수 |

---

## 8. 주간 복습

복습 페이지에서 사용 (FE 미구현).

```
GET /v1/users/{user_nickname}/review/weekly
```

### Response Body

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `selectedWeakSessions` | `selected_weak_sessions` | `object[]` | 최저점 세션 목록 (재도전 카드용) |
| `chosungQuiz` | `chosung_quiz` | `object[]` | 초성 퀴즈 문제 배열 |
| `flashcards` | `flashcards` | `object[]` | 플래시 카드 배열 |

---

## 부록 A. FE 전용 타입 (BE 미제공)

> BE API 응답에 없지만 FE UI에서 필요하여 FE가 자체 관리하거나 파싱하는 데이터.

### `EvaluationScores` — 3축 개별 점수

FE 타입: `types/result.ts`
> BE `feedback` 텍스트에서 파싱하거나 BE에 필드 추가 요청 필요.

| FE 필드 | 타입 | 설명 | 가중치 |
|---------|------|------|--------|
| `vocabulary` | `number` | 어휘 점수 (0~10) | 30% |
| `situation` | `number` | 상황 대처 점수 (0~10) | 50% |
| `grammar` | `number` | 문법 점수 (0~10) | 20% |

### `WrongWord` — 오답 단어

FE 타입: `types/result.ts`
> BE `feedback` 또는 `highlightedLog`에서 파싱 필요.

| FE 필드 | 타입 | 설명 |
|---------|------|------|
| `original` | `string` | 사용자가 쓴 표현 |
| `corrected` | `string` | 올바른 표현 |
| `meaning` | `string` | 뜻풀이 |

### `FeedbackMessage` — 오답 하이라이트 대화 로그

FE 타입: `types/result.ts`
> BE `highlightedLog`를 FE 포맷으로 변환하여 피드백 화면에서 사용.

| FE 필드 | BE 필드 | 타입 | 설명 |
|---------|---------|------|------|
| `speaker` | `speaker` | `"user"` \| `"ai"` | 발화자 |
| `utterance` | `text` | `string` | 발화 내용 |
| `hasError` | `has_error` | `boolean` | 오류 존재 여부 |
| `errorHighlights` | `error_highlights` | `string[]?` | 오답 부분 텍스트 배열 |

---

## 부록 B. FE 로컬 저장소 구조

### localStorage

| 키 | 값 타입 | 설명 |
|----|---------|------|
| `userId` | `string` (UUID) | 유저 고유 ID (`crypto.randomUUID()`) |
| `setupProfile` | `JSON` (`SetupProfile`) | 맞춤 학습 설정 프로필 |
| `setupDone` | `"true"` | 설정 완료 플래그 |
| `theme` | `"dark"` \| `"light"` | 테마 설정 |

#### `SetupProfile` 저장 형식 (FE camelCase)

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "country": "US",
  "userNickname": "빛나는별",
  "koreanLevel": "초급",
  "culturalInterest": "K-Pop",
  "location": "hangang"
}
```

### sessionStorage

| 키 | 값 타입 | 설명 |
|----|---------|------|
| `myPersona` | `JSON` (`Persona`) | 사용자가 선택한 역할 |
| `counterpart` | `JSON` (`CounterpartInfo`) | AI가 맡는 역할 |
| `scene` | `string` | 시나리오 설명 |
| `sessionId` | `string` | 현재 세션 ID |

---

## 부록 C. API 흐름도

```
[맞춤 학습 설정 완료]
        │ localStorage: { userId, setupProfile }
        ▼
[장소 선택] ─── POST /v1/sessions ───▶ 시나리오 + 페르소나 A/B
        │
        ▼
[역할 선택] ─── POST /v1/sessions/{id}/role ───▶ AI 첫 발화 (latestAiResponse)
        │ sessionStorage: { myPersona, counterpart, sessionId }
        ▼
[채팅 루프] ─── POST /v1/sessions/{id}/turns ───▶ AI 응답 (turnLimit까지 반복)
        │                                            isFinished === true
        ▼
[평가 요청] ─── POST /v1/sessions/{id}/evaluation ───▶ 점수 + 피드백 + SCK 분석
        │
        ├──▶ [결과 화면] totalScore10, grade, llmSummary
        │
        └──▶ [피드백 화면] feedback, highlightedLog → (FE 파싱) wrongWords, EvaluationScores

[홈 화면] ──┬── GET /v1/users/{nickname}/profile ───▶ userNickname, grade
            ├── GET /v1/users/{nickname}/weekly-stats ───▶ conversationCount, averageScore
            └── GET /v1/users/{nickname}/review/count ───▶ chosungQuizCount, flashcardCount
```

---

## 부록 D. 미해결 사항

| # | 질문 | 관련 API | 상태 |
|---|------|----------|------|
| 1 | `location` 값: FE `"hangang"` (영문 ID) vs BE `"한강"` (한글) — 어느 쪽 기준? | `POST /v1/sessions` | ❓ |
| 2 | `grade` 매핑: BE `"Beginner <B>"` ↔ FE `"Bronze"` 등 — 매핑 규칙 확정 필요 | 평가, 프로필 | ❓ |
| 3 | 3축 개별 점수 (어휘/상황/문법): BE에 필드 추가? FE에서 `feedback` 파싱? | 평가 | ❓ |
| 4 | XP / `streakDays`: BE에 추가? FE 자체 관리? | 프로필, 통계 | ❓ |
| 5 | `WrongWord[]` 오답 목록: BE에 별도 필드 추가? `highlightedLog`에서 파싱? | 평가 | ❓ |
