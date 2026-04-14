# API 명세 vs 프론트엔드 코드 비교 리포트

**대상 파일**
- BE 명세: `docs/backend-api-docs.md` (OpenAPI 3.1)
- FE 구현: `lib/api.ts`, `types/api.ts`

**작성일**: 2026-04-14

---

## 1. 한눈에 보는 요약

| 엔드포인트 | 메서드 | 경로/요청 | 응답 필드명 | 상태 |
|---|---|---|---|---|
| 세션 생성 | POST | `/sessions` | ⚠️ snake_case vs camelCase 불일치 | 🔴 확인 필요 |
| 역할 선택 | POST | `/sessions/{id}/role` | ⚠️ snake_case vs camelCase 불일치 | 🔴 확인 필요 |
| 턴 진행 | POST | `/sessions/{id}/turns` | ⚠️ snake_case vs camelCase 불일치 | 🔴 확인 필요 |
| 평가 | POST | `/sessions/{id}/evaluation` | ⚠️ snake_case vs camelCase 불일치 + `lang` 쿼리 스펙에 없음 | 🔴 확인 필요 |
| 세션 조회 | GET | `/sessions/{id}` | ⚠️ snake_case vs camelCase 불일치 | 🔴 확인 필요 |
| 복습 개수 | GET | `/users/{nickname}/review/count` | camelCase 일치 | ✅ OK |
| 주간 복습 | GET | `/users/{nickname}/review/weekly` | camelCase 일치 | ✅ OK |
| 주간 통계 | GET | `/users/{nickname}/weekly-stats` | camelCase 일치 | ✅ OK |
| 유저 프로필 | GET | `/users/{nickname}/profile` | camelCase 일치 | ✅ OK |
| 유저 세션 목록 | GET | `/users/{nickname}/sessions` | camelCase 일치 | ✅ OK |

> 전체 엔드포인트 **10개 중 5개**가 응답 스키마 불일치 의심 상태입니다.

---

## 2. 가장 큰 문제: 응답 필드명이 두 가지 스타일로 섞여 있어요

### 쉽게 설명하면
백엔드는 JSON을 보낼 때 필드 이름을 두 가지 스타일로 쓸 수 있어요.

- `session_id` (snake_case, 언더스코어 사용)
- `sessionId` (camelCase, 낙타등처럼 대문자)

`lib/api.ts` 맨 위 주석에는 이렇게 적혀 있어요:
> "BE가 Pydantic alias_generator로 camelCase 직렬화하므로 FE/BE 모두 camelCase JSON 사용"

그래서 프론트엔드 타입(`types/api.ts`)은 전부 **camelCase**로 되어 있어요.
그런데 `docs/backend-api-docs.md`(OpenAPI 명세)를 실제로 보면 응답 일부가 여전히 **snake_case**로 남아 있어요.

### 불일치가 의심되는 응답들

#### 🔴 `CreateSessionResponse` (POST /sessions)

| FE가 기대하는 이름 (camelCase) | 명세에 적힌 이름 (snake_case) |
|---|---|
| `sessionId` | `session_id` |
| `userProfile` | `user_profile` |
| `koreanLevel` | `korean_level` |
| `scenarioTitle` | `scenario_title` |
| `relationshipType` | `relationship_type` |
| `dialogueFunction` | `dialogue_function` |
| `turnLimit` | `turn_limit` |

일치하는 필드: `location`, `scene`, `personas`

#### 🔴 `SessionStateResponse` (POST /role, POST /turns, GET /sessions/{id})

위 필드에 더해 아래도 불일치:

| FE가 기대하는 이름 | 명세에 적힌 이름 |
|---|---|
| `selectedRole` | `selected_role` |
| `conversationLog` | `conversation_log` |
| `turnCount` | `turn_count` |
| `isFinished` | `is_finished` |
| `latestAiResponse` | `latest_ai_response` |
| `createdAt` | `created_at` |

#### 🔴 `EvaluationResponse` (POST /evaluation)

| FE가 기대하는 이름 | 명세에 적힌 이름 |
|---|---|
| `sessionId` | `session_id` |
| `conversationLog` | `conversation_log` |
| `scenarioTitle` | `scenario_title` |
| `wrongWordPool` | `wrong_word_pool` |
| `lengthScore` | `length_score` |
| `vocabScore` | `vocab_score` |
| `contextScore` | `context_score` |
| `contextSceneMissionMatch` | `context_scene_mission_match` |
| `contextRelationshipMatch` | `context_relationship_match` |
| `spellingScore` | `spelling_score` |
| `totalScore10` | `total_score_10` |
| `llmSummary` | `llm_summary` |
| `sckMatchCount` | `SCK_match_count` |
| `sckTotalTokens` | `SCK_total_tokens` |
| `sckMatchRate` | `SCK_match_rate` |
| `sckLevelCounts` | `SCK_level_counts` |
| `sckLevelWordCounts` | `SCK_level_word_counts` |

특히 `SCK_*`는 **대문자 snake_case**라 더 특이해요. camelCase alias가 적용되지 않은 걸로 보여요.

### 왜 중요한가요?
런타임에서 `data.sessionId`를 읽으면 `undefined`가 나올 수 있어요. 그러면 결과 페이지, 채팅 페이지에서 데이터가 깨져서 나오거나 에러가 터져요.

### 어떻게 확인하면 좋을까요?
1. 브라우저 Network 탭에서 실제 응답 JSON을 직접 확인하기 (F12 → Network → POST /sessions → Response).
2. 만약 **실제 응답이 camelCase**이면 → OpenAPI 명세가 오래된 것. 명세를 다시 뽑아달라고 백엔드에 요청.
3. 만약 **실제 응답이 snake_case**이면 → `lib/api.ts`에서 `snakeToCamel` 변환 유틸을 넣거나, `types/api.ts`를 snake_case로 바꿔야 함.

✅ **이미 camelCase가 확정된 엔드포인트들**: `UserProfileResponse`, `WeeklyStatsResponse`, `ReviewCountResponse`, `UserSessionsResponse`, `WeeklyReviewResponse` — 이건 명세와 FE가 맞음.

---

## 3. 그 외 작은 불일치

### 🟠 `evaluateSession`의 `lang` 쿼리 파라미터가 명세에 없어요

- 코드 위치: `lib/api.ts:129`
  ```ts
  const qs = lang ? `?lang=${lang}` : "";
  return apiFetch(`/sessions/${sessionId}/evaluation${qs}`, { method: "POST" });
  ```
- OpenAPI 명세: `/v1/sessions/{session_id}/evaluation`에는 쿼리 파라미터가 없음.

**가능한 경우**
- (A) 백엔드는 `lang`을 실제로 받고 있는데 OpenAPI에 적지 않은 것 → 명세 업데이트 필요
- (B) 백엔드는 `lang`을 무시하고 있음 → 다국어 피드백이 안 되는 상태

→ 백엔드에 "lang 쿼리 실제로 받는지" 확인 필요.

### 🟠 경로 접두사 `/v1` 처리

- OpenAPI 명세: `/v1/sessions`, `/v1/users/...`
- FE 코드: `/sessions`, `/users/...` (v1 없음)

`lib/api.ts`는 `BASE_URL = process.env.NEXT_PUBLIC_API_URL` 값 뒤에 바로 경로를 붙여요.
따라서 `NEXT_PUBLIC_API_URL`에 이미 `https://.../v1`처럼 `/v1`이 포함돼 있어야 정상 작동해요.

✅ **확인 방법**: `.env.local` 파일 또는 배포 환경변수에서 `NEXT_PUBLIC_API_URL` 값 끝에 `/v1`이 붙었는지 확인.

### 🟢 요청 바디는 문제 없음

요청 타입은 모두 camelCase로 명세와 FE가 일치합니다.
- `CreateSessionRequest`: `userId`, `userNickname`, `country`, `koreanLevel`, `culturalInterest`, `location` ✅
- `SelectRoleRequest`: `selectedRole` ✅
- `CreateTurnRequest`: `userInput` ✅

### 🟢 FE 타입에만 있는 선택적 필드들 (문제 없음)

`types/api.ts`에는 명세에 없는 `scenarioTitleEn`, `sceneEn`, `roleEn`, `missionEn`, `genderEn`, `avatarUrl`이 선택(`?`)으로 있어요. 이건 FE에서 i18n용으로 쓰려고 미리 넓혀둔 것으로 보여요. 백엔드가 안 보내도 에러 안 남 → OK.

---

## 4. 체크리스트 (백엔드 담당자에게 문의)

- [ ] `POST /v1/sessions` 응답의 실제 필드명이 `session_id`인지 `sessionId`인지
- [ ] `POST /v1/sessions/{id}/role` / `/turns`, `GET /v1/sessions/{id}` 응답 동일 확인
- [ ] `POST /v1/sessions/{id}/evaluation` 응답 — 특히 `SCK_*` 필드가 `sckMatchCount` 형태로 오는지
- [ ] `/evaluation` 엔드포인트가 `lang` 쿼리 파라미터를 실제로 받는지
- [ ] 배포 환경에서 `NEXT_PUBLIC_API_URL`에 `/v1`이 포함되어 있는지

---

## 5. 권장 대응 순서

1. **(긴급) 실제 응답 확인** — 브라우저 Network 탭으로 3개 엔드포인트의 진짜 응답 확인.
2. **(긴급) 불일치면 변환 레이어 추가** — `lib/api.ts`에 snake→camel 변환 헬퍼 넣기. 또는 백엔드 alias_generator 적용 확인 후 명세 재생성.
3. **(일반) `lang` 쿼리 확인** — 필요 없으면 FE에서 제거, 필요하면 명세에 추가 요청.
4. **(일반) 주석 갱신** — `lib/api.ts` 맨 위 주석이 현실과 다르면 업데이트.
