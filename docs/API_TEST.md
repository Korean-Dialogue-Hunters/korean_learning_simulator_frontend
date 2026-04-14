# API 테스트 (curl 모음)

> **Base URL**: `http://127.0.0.1:8000/v1` (로컬 BE)
> **Convention**: 요청/응답 모두 **camelCase**. BE Pydantic이 `alias_generator=_to_camel`로 직렬화하므로 snake_case로 보내지 말 것.
> **사전 조건**: BE 서버가 `127.0.0.1:8000`에서 떠 있어야 함. Swagger UI는 `http://127.0.0.1:8000/docs`.
>
> 본 문서는 두고두고 쓰는 테스트 치트시트. 새 엔드포인트 생기면 같은 형식으로 추가.

---

## 사용 팁

> ⚠️ **PowerShell에서는 `curl`이 안 먹힘.** PowerShell의 `curl`은 `Invoke-WebRequest`의 alias라 `-H`/`-d` 같은 진짜 curl 옵션을 못 받음. 다음 중 하나로 우회:
>   - **(권장) Git Bash 사용** — 본 문서 예제 그대로 복붙 가능
>   - PowerShell이라면 `curl.exe`를 명시적으로 호출 (줄바꿈은 백틱 `` ` ``, 따옴표는 백슬래시 이스케이프)
>   - 또는 PowerShell 네이티브 `Invoke-RestMethod` 사용 — 본 문서 맨 아래 부록 참조

- **Git Bash 환경**에서 그대로 복붙 가능. 따옴표는 작은따옴표로 감싸 한글/특수문자 이스케이프 회피.
- 응답이 길면 `| python -m json.tool` 또는 `| jq .`로 예쁘게 출력.
- `SESSION_ID`, `NICKNAME` 등은 셸 변수로 미리 export 해두면 편함:
  ```bash
  export NICKNAME=user123
  export SESSION_ID=5e599a28-c5d0-4493-83c8-60bb650f17e6
  ```
- `userId`는 UUID v4 형식. 신규 요청용 임시 UUID:
  `123e4567-e89b-12d3-a456-426614174000`

---

## 0. 헬스 체크

BE 루트(`/`)가 헬스체크 역할. `/health` 라우터는 코드만 있고 `app/main.py`에 등록 안 됨 — 호출하면 404.

```bash
curl -s http://127.0.0.1:8000/
```

응답 예: `{"service":"...","model":"...","status":"ok"}`

---

## 1. 세션 생성 — `POST /v1/sessions`

시나리오·페르소나 생성 후 `sessionId` 발급. 역할 선택 전 상태.

```bash
curl -s -X POST http://127.0.0.1:8000/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "userNickname": "user123",
    "country": "USA",
    "koreanLevel": "Beginner",
    "culturalInterest": ["K-media", "K-beauty"],
    "location": "한강"
  }'
```

**필드 메모**
- `koreanLevel`: `Beginner` / `Intermediate` / `Advanced` (또는 한국어 `초급`/`중급`/`고급`도 BE가 자동 변환)
- `location`: 현재 MVP는 `"한강"`만 지원
- `culturalInterest`: 문자열 배열, 빈 배열 허용

**응답 (CreateSessionResponse) 주요 필드**
`sessionId, userProfile, koreanLevel, location, scenarioTitle, scene, personas{A,B}, relationshipType, dialogueFunction, turnLimit`

---

## 2. 세션 조회 — `GET /v1/sessions/{sessionId}`

역할 선택 이후 현재 state 조회.

```bash
curl -s http://127.0.0.1:8000/v1/sessions/$SESSION_ID
```

**응답 (SessionStateResponse) 주요 필드**
`sessionId, userProfile, koreanLevel, location, scenarioTitle, scene, personas, relationshipType, dialogueFunction, turnLimit, selectedRole, conversationLog[], turnCount, isFinished, latestAiResponse, createdAt`

---

## 3. 역할 선택 — `POST /v1/sessions/{sessionId}/role`

유저가 A/B 선택 → AI 첫 발화 생성.

```bash
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/role \
  -H 'Content-Type: application/json' \
  -d '{
    "selectedRole": "A"
  }'
```

**필드 메모**
- `selectedRole`: `"A"` 또는 `"B"`만 허용

응답: `SessionStateResponse` (role 선택 후 상태, `latestAiResponse`에 AI 첫 발화 포함)

---

## 4. 턴 진행 — `POST /v1/sessions/{sessionId}/turns`

유저 발화 → AI 응답. `turnLimit` 도달 시 `isFinished=true`.

```bash
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/turns \
  -H 'Content-Type: application/json' \
  -d '{
    "userInput": "안녕하세요! 주말에 뭐해요?"
  }'
```

응답: `SessionStateResponse` (`conversationLog`에 유저+AI 턴 추가, `turnCount` 증가).

---

## 5. 평가 요청 — `POST /v1/sessions/{sessionId}/evaluation`

대화 종료 후 점수·피드백 생성. body 없음.

```bash
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/evaluation
```

**응답 (EvaluationResponse) 주요 필드**
```
sessionId, conversationLog[], location, scenarioTitle, scene, wrongWordPool[],
lengthScore, vocabScore, contextScore,
contextSceneMissionMatch (0-3), contextRelationshipMatch (0-3),
spellingScore, totalScore10, grade, feedback, llmSummary,
SCK_match_count, SCK_total_tokens, SCK_match_rate,
SCK_level_counts{1급,2급,...}, SCK_level_word_counts{1급:[],...}
```

> ⚠️ `SCK_*` 필드는 alias 변환 대상이 아니라 **원본 그대로** snake-ish하게 옴.

---

## 6. 유저 프로필 — `GET /v1/users/{nickname}/profile`

```bash
curl -s http://127.0.0.1:8000/v1/users/$NICKNAME/profile
```

**응답 (UserProfileResponse)**
`userId, userNickname, country, koreanLevel, culturalInterest[], latestGrade`

> 신규 유저는 404 반환. FE는 빈 상태로 처리 중 (`docs/BE_REQUESTS.md` BE-01 참조).

---

## 7. 주간 통계 — `GET /v1/users/{nickname}/weekly-stats`

```bash
curl -s http://127.0.0.1:8000/v1/users/$NICKNAME/weekly-stats
```

**응답 (WeeklyStatsResponse)**
```
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userNickname": "user123",
  "sessionsPerUserCount": 5,
  "averageScore": 87.5,
  "latestGrade": "Beginner <B>",
  "streakDays": 3
}
```

---

## 8. 복습 콘텐츠 개수 — `GET /v1/users/{nickname}/review/count`

```bash
curl -s http://127.0.0.1:8000/v1/users/$NICKNAME/review/count
```

**응답 (ReviewCountResponse)**
```
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userNickname": "user123",
  "chosungQuizCount": 3,
  "flashcardCount": 10
}
```

---

## 9. 주간 복습 콘텐츠 — `GET /v1/users/{nickname}/review/weekly`

```bash
curl -s http://127.0.0.1:8000/v1/users/$NICKNAME/review/weekly
```

**응답 (WeeklyReviewResponse)**
```
{
  "userProfile": { ... UserProfile 필드들 ... },
  "justBeforeSession": [{ "sessionId": "abc123", "totalScore10": 6.0 }],
  "wrongWordPool": ["맣다->맞다", "되요->돼요"],
  "chosungQuiz": [{ "quizId": "q1", "correct": true }],
  "flashcards": [{ "word": "사과", "meaning": "apple" }]
}
```

> `chosungQuiz`/`flashcards` 항목은 자유형식 dict. 위는 예시.

---

## 10. 유저 세션 목록 — `GET /v1/users/{nickname}/sessions`

완료된 세션만, 정렬 옵션 지원.

```bash
# 기본 (recent)
curl -s "http://127.0.0.1:8000/v1/users/$NICKNAME/sessions"

# 점수 높은 순
curl -s "http://127.0.0.1:8000/v1/users/$NICKNAME/sessions?sort=score_high"
```

**`sort` 허용값**: `recent` | `oldest` | `score_high` | `score_low` | `location`

**응답 (UserSessionsResponse)**
```
{
  "sessions": [
    {
      "sessionId": "abc-123",
      "scenarioTitle": "한강 자전거길에서 길 찾기",
      "location": "한강",
      "scene": "한강 자전거길에서 길을 잃은 상황",
      "totalScore10": 7.5,
      "grade": "Intermediate <S>",
      "turnCount": 5,
      "turnLimit": 7,
      "createdAt": "2026-04-07T14:30:00Z"
    }
  ],
  "totalCount": 12
}
```

---

## 풀 시나리오 (1번 → 5번까지 한 번에 돌리기)

세션 생성 → 역할 선택 → 턴 2회 → 평가까지 잇는 골든 패스. 중간에 jq로 `sessionId` 추출.

```bash
# 1) 세션 생성
SESSION_ID=$(curl -s -X POST http://127.0.0.1:8000/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "userNickname": "user123",
    "country": "USA",
    "koreanLevel": "Beginner",
    "culturalInterest": ["K-media"],
    "location": "한강"
  }' | jq -r '.sessionId')
echo "SESSION_ID=$SESSION_ID"

# 2) 역할 선택
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/role \
  -H 'Content-Type: application/json' \
  -d '{"selectedRole":"A"}' | jq '.latestAiResponse'

# 3) 턴 1회
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/turns \
  -H 'Content-Type: application/json' \
  -d '{"userInput":"안녕하세요! 주말에 뭐해요?"}' | jq '{turnCount, isFinished, latestAiResponse}'

# 4) 턴 2회
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/turns \
  -H 'Content-Type: application/json' \
  -d '{"userInput":"저는 한강에 산책 가려고요."}' | jq '{turnCount, isFinished, latestAiResponse}'

# 5) 평가
curl -s -X POST http://127.0.0.1:8000/v1/sessions/$SESSION_ID/evaluation \
  | jq '{totalScore10, grade, vocabScore, lengthScore, spellingScore}'
```

---

## 부록: PowerShell 사용자용

### 방법 1 — `curl.exe` 명시 호출

PowerShell에서 진짜 curl 바이너리 직접 호출. 줄바꿈은 백틱(`` ` ``), JSON 안의 따옴표는 `\"`로 이스케이프.

```powershell
curl.exe -s -X POST http://127.0.0.1:8000/v1/sessions `
  -H "Content-Type: application/json" `
  -d '{\"userId\":\"123e4567-e89b-12d3-a456-426614174000\",\"userNickname\":\"user123\",\"country\":\"USA\",\"koreanLevel\":\"Beginner\",\"culturalInterest\":[\"K-media\",\"K-beauty\"],\"location\":\"한강\"}'
```

### 방법 2 — `Invoke-RestMethod` (PowerShell 네이티브, 객체 응답)

```powershell
$body = @{
  userId = "123e4567-e89b-12d3-a456-426614174000"
  userNickname = "user123"
  country = "USA"
  koreanLevel = "Beginner"
  culturalInterest = @("K-media","K-beauty")
  location = "한강"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/v1/sessions `
  -ContentType "application/json" -Body $body
```

GET 예:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/v1/users/user123/weekly-stats
```

---

## 디버그 체크리스트

요청이 안 먹힐 때:
1. **400/422**: 요청 body 키가 camelCase인지 확인 (`userId` ✓, `user_id` ✗). `koreanLevel` 값이 허용 범위인지 확인.
2. **404 (user)**: 신규 유저면 BE-01 미구현 영향. 셋업 → 세션 1회 만들면 user row 생긴다고 가정.
3. **404 (session)**: `sessionId` 만료/오타. `GET /v1/sessions/{id}`로 존재 확인.
4. **CORS**: FE에서 호출하는데 막히면 BE CORS 미들웨어 확인 (`korean_learning_simulator_backend/main.py`).
5. **스키마 변경 의심**: 정답은 항상 Swagger UI (`http://127.0.0.1:8000/docs`).
