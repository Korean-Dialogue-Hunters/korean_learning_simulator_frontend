# 트랙 6 — 세션 진척도: BE 요청 정리

> **작성일**: 2026-04-16
> **작성 근거**: BE 레포 (`korean_learning_simulator_backend`) 전체 코드 검증 후 작성
> **FE TODO 참조**: `docs/TODO.md` 트랙 6 (T6-01 ~ T6-02)

---

## 기능 개요

기록 탭의 대화 세션 카드마다 **"완벽 완수" 여부를 별 3개로 표시**:

| 별 | 조건 | 데이터 출처 | 담당 |
|----|------|------------|------|
| ★ 1 | **대화 Grade A 획득** — 평가 등급 S 또는 A | `evaluation.grade` → FE에서 직접 판별 | **FE (완료)** |
| ★ 2 | **초성퀴즈 4/5점 이상** — 해당 세션의 초성퀴즈 점수 | 없음 (신규 필요) | BE |
| ★ 3 | **플래시카드 완료** — 5장 모두 "암기 완료" | 없음 (신규 필요) | BE |

> **★ 1 Grade A 판별은 BE 관여 없이 FE 단독 처리.**
> 세션 목록 API가 이미 `grade` 문자열을 내려주므로 FE에서 `<S>` ���는 `<A>` 포함 여부로 판별.
> BE에 `grade_a_achieved` bool 필드를 별도로 요청하지 않음.

---

## 현재 BE 상태

### 이미 있는 것

| 항목 | 위치 | 설명 |
|------|------|------|
| 세션별 등급 | `evaluation` 테이블 → `grade` | `"Beginner <B>"` 형태로 저장. S/A/B/C 추출 가능 |
| 세션 목록 API | `GET /v1/users/{nickname}/sessions` | `UserSessionItem`에 `grade`, `totalScore10` 포함 |
| 초성퀴즈 레코드 | `chosung_quiz` 테이블 (`ChosungQuizRecord`) | `session_id`, `question`, `answer`, `choices` — **문제 데이터만 저장, 점수 없음** |
| 플래시카드 레코드 | `flashcard` 테이블 (`FlashcardRecord`) | `session_id`, `word_front`, `meaning_back` — **카드 데이터만 저장, 완료 여부 없음** |
| 등급 계산 | `infra/scoring/service.py` | S≥9.1, A≥7.1, B≥5.1, C=나머지 |

### 없는 것 (신규 필요)

- 초성퀴즈 응시 결과 (점수) 저장
- 플래시카드 암기 완료 상태 저장
- 세션 목록 API에 진척도 필드 포함

---

## BE 요청 목록

---

### BE-T6-01: 초성퀴즈 결과 저장 엔드포인트

**대응 TODO**: T6-01

**현재 문제**:
- `chosung_quiz` 테이블에는 문제 데이터(`question`, `answer`, `choices`)만 저장됨
- 유저가 퀴즈를 풀고 나서 **몇 문제 맞았는지 기록이 남지 않음**
- FE review 페이지에서 퀴즈를 풀면 결과가 클라이언트 메모리에만 존재하고 사라짐

**요청 내용**:

#### 방식 A — 별도 결과 테이블 (권장)

```sql
CREATE TABLE chosung_quiz_result (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,          -- 어떤 세션의 퀴즈인지
  correct_count INT NOT NULL,        -- 맞은 개수 (0~5)
  total_count INT NOT NULL,          -- 전체 문제 수 (보통 5)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**엔드포인트**:
```
POST /v1/users/{user_nickname}/review/quiz-result
Content-Type: application/json

Request body:
{
  "sessionId": "uuid-string",
  "correctCount": 4,
  "totalCount": 5
}

Response (201 Created):
{
  "sessionId": "uuid-string",
  "correctCount": 4,
  "totalCount": 5,
  "passed": true              // correctCount >= 4 이면 true
}
```

**BE 참고 코드**:
- `infra/persistence/models.py` — `ChosungQuizRecord` 클래스 옆에 `ChosungQuizResultRecord` 추가
- `infra/persistence/supabase_repository.py` — insert/select 메서드 추가
- `api/users.py` — 엔드포인트 등록

#### 방식 B — 기존 테이블에 컬럼 추가

`chosung_quiz` 테이블에 `user_correct: bool` 컬럼 추가 후 문제별로 정답 여부 업데이트.
단점: 문제가 5개면 5번 UPDATE 필요. 방식 A가 깔끔함.

**선호**: 방식 A

---

### BE-T6-02: 플래시카드 완료 상태 저장 엔드포인트

**대응 TODO**: T6-01

**현재 문제**:
- `flashcard` 테이블에는 카드 데이터(`word_front`, `meaning_back`)만 저장됨
- 유저가 "암기 완료" 버튼을 눌러도 **완료 상태가 저장되지 않음**

**요청 내용**:

```sql
CREATE TABLE flashcard_completion (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,          -- 어떤 세션의 플래시카드인지
  completed_count INT NOT NULL,      -- 암기 완료 누른 카드 수
  total_count INT NOT NULL,          -- 전체 카드 수 (보통 5)
  all_done BOOLEAN NOT NULL DEFAULT FALSE,  -- 전부 완료 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**엔드포인트**:
```
POST /v1/users/{user_nickname}/review/flashcard-result
Content-Type: application/json

Request body:
{
  "sessionId": "uuid-string",
  "completedCount": 5,
  "totalCount": 5
}

Response (201 Created):
{
  "sessionId": "uuid-string",
  "completedCount": 5,
  "totalCount": 5,
  "allDone": true              // completedCount == totalCount 이면 true
}
```

**BE 참고 코드**:
- `infra/persistence/models.py` — `FlashcardRecord` 클래스 옆에 `FlashcardCompletionRecord` 추가
- 나머지는 BE-T6-01과 동일 패턴

---

### BE-T6-03: 세션 목록 API에 진척도 필드 추가

**대응 TODO**: T6-01, T6-02

**현재 문제**:
- `GET /v1/users/{nickname}/sessions`의 `UserSessionItemResponse`에는 `grade`, `totalScore10`만 있음
- FE가 세션 목록을 받을 때 진척도 3항목을 한 번에 알 수 없음
- 현재 FE는 **grade에서 A/S 여부만 판별 가능**, 나머지 2항목은 목데이터 사용 중

**요청 내용**:

`UserSessionItemResponse` 스키마에 다음 2개 필드 추가:

```python
# schemas/user.py — UserSessionItemResponse에 추가
class UserSessionItemResponse(BaseModel):
    # ... 기존 필드 (grade 포함) ...
    
    # 진척도 (T6) — grade_a는 FE가 grade 문자열에서 직접 판별하므로 별도 필드 불필요
    chosung_quiz_passed: bool = False   # 초성퀴즈 4/5+ 달성 여부
    flashcard_done: bool = False        # 플래시카드 전체 완료 여부
```

**로직** (`api/users.py` 또는 `supabase_repository.py`에서):
1. `chosung_quiz_passed`: `chosung_quiz_result` 테이블에서 해당 session_id의 **최고 기록** `correct_count >= 4` 여부 조회
2. `flashcard_done`: `flashcard_completion` 테이블에서 해당 session_id의 `all_done = true` 여부 조회

**쿼리 최적화 참고**:
- 세션 목록 조회 시 LEFT JOIN으로 한 번에 가져오면 N+1 문제 없음:

```sql
SELECT s.*, 
       e.grade,
       -- 재응시 허용 → 최고 기록 기준으로 판정
       COALESCE((SELECT MAX(qr.correct_count) >= 4
                 FROM chosung_quiz_result qr
                 WHERE qr.session_id = s.session_id), false) AS chosung_quiz_passed,
       COALESCE((SELECT fc.all_done
                 FROM flashcard_completion fc
                 WHERE fc.session_id = s.session_id
                 ORDER BY fc.created_at DESC LIMIT 1), false) AS flashcard_done
FROM session s
JOIN evaluation e ON e.session_id = s.session_id
WHERE s.user_id = :user_id
  AND s.is_finished = true
ORDER BY s.created_at DESC;
```

**BE 참고 코드**:
- `supabase_repository.py get_sessions_by_user()` (약 350행) — 현재 session + evaluation 조인하여 세션 목록 반환
- 여기에 `chosung_quiz_result`, `flashcard_completion` LEFT JOIN 추가

---

## FE 현재 상태 (참고)

FE는 이미 다음을 구현 완료:
- `types/api.ts`에 `SessionProgress` 타입 정의 (`gradeA`, `chosungQuizPassed`, `flashcardDone`)
- `app/history/page.tsx`에 별 3개 UI + 툴팁 구현
- **목데이터** (`mockProgress()`)로 grade에서 A/S 판별 + 나머지 랜덤 생성 중

**BE 배포 후 FE 후속 작업**:
1. `review/page.tsx` — 퀴즈 완료 시 `POST .../quiz-result` 호출 추가 (재응시마다 매번 호출)
2. `review/page.tsx` — 마지막 플래시카드 "암기 완료" 클릭 시 `POST .../flashcard-result` 호출 추가
3. `UserSessionItem` 타입에 `chosungQuizPassed`, `flashcardDone` 필드 추가 (gradeA는 FE 자체 판별 유지)
4. `history/page.tsx`에서 `mockProgress()` 제거 → BE 응답의 실제 데이터 사용

---

### BE-T6-04: 세션 재도전 엔드포인트

**대응 TODO**: T6 진척도 달성을 위한 대화 재도전

**배경**:
- 유저가 Grade B를 받았지만 퀴즈/플래시카드 별은 이미 획득한 상태
- 대화만 재도전해서 Grade A를 받으면 ★★★ 완성
- 세션 ID는 유지해야 기록 탭에 카드가 중복 생성되지 않음

**엔드포인트**:
```
POST /v1/sessions/{session_id}/retry

Response: SessionStateResponse (역할 이미 선택됨 → FE에서 /chat으로 바로 진입)
```

**BE 로직**:

```
1. 시나리오 정보 유지 (항상 건드리지 않음):
   ├── session.location
   ├── session.scenario_title / scene
   ├── session.personas (A/B)
   ├── session.relationship_type / dialogue_function
   ├── session.selected_role
   └── session.turn_limit

2. 대화 + 평가 초기화 (항상):
   ├── DELETE FROM conversation_log WHERE session_id = :id
   ├── DELETE FROM evaluation WHERE session_id = :id
   ├── UPDATE session SET turn_count=0, is_finished=false, created_at=NOW()
   └── (AI 첫 발화 재생성 → latest_ai_response 갱신)

3. 복습 데이터 — ★ 별 유무에 따라 분기:
   
   [초성퀴즈]
   ├── 별 있음 (quiz_result.correct_count >= 4 기록 있음)
   │   → chosung_quiz 유지, chosung_quiz_result 유지
   └── 별 없음
       → DELETE chosung_quiz WHERE session_id = :id
       → DELETE chosung_quiz_result WHERE session_id = :id
       → 새 대화 완료 후 주간 복습에서 재생성

   [플래시카드]
   ├── 별 있음 (flashcard_completion.all_done = true 기록 있음)
   │   → flashcard 유지, flashcard_completion 유지
   └── 별 없음
       → DELETE flashcard WHERE session_id = :id
       → DELETE flashcard_completion WHERE session_id = :id
       → 새 대화 완료 후 주간 복습에서 재생성
```

**판정 쿼리 (retry 전 체크)**:
```sql
-- 퀴즈 별 있는지
SELECT EXISTS(
  SELECT 1 FROM chosung_quiz_result
  WHERE session_id = :id AND correct_count >= 4
) AS quiz_star;

-- 플래시카드 별 있는지
SELECT EXISTS(
  SELECT 1 FROM flashcard_completion
  WHERE session_id = :id AND all_done = true
) AS flashcard_star;
```

**FE 플로우**:
1. 기록 탭 → 카드 클릭 → 결과 페이지 → "재도전" 버튼
2. `POST /v1/sessions/{session_id}/retry` 호출
3. 응답 받으면 `/chat`으로 바로 진입 (역할 선택 건너뜀)
4. 대화 완료 → 평가 → Grade A 받으면 ★ 대화 별 획득
5. 기존 퀴즈/플래시카드 별은 그대로 유지

**에러 처리**:
- 세션이 `is_finished=false` (진행 중)이면 → 400 Bad Request
- 세션이 없으면 → 404 Not Found

---

## 요약: BE 작업 우선순위

| 순서 | 요청 ID | 내용 | 난이도 | 선결 조건 |
|------|---------|------|--------|-----------|
| 1 | BE-T6-01 | 초성퀴즈 결과 테이블 + 저장 API | 낮음 | 없음 |
| 2 | BE-T6-02 | 플래시카드 완료 테이블 + 저장 API | 낮음 | 없음 |
| 3 | BE-T6-03 | 세션 목록 API에 진척도 2필드 추가 | 중간 | BE-T6-01, BE-T6-02 |
| 4 | BE-T6-04 | 세션 재도전 (대화+평가만 리셋) | 중간 | 없음 |

> BE-T6-01, BE-T6-02, BE-T6-04는 독립적이므로 **병렬 작업 가능**.
> BE-T6-03은 01, 02가 있어야 JOIN 가능.

---

## 결정된 사항

| 항목 | 결정 |
|------|------|
| Grade A 판별 | FE 단독 처리 (BE 필드 불필요) |
| 플래시카드 완료 기준 | 마지막 카드에서 "암기 완료" 클릭 시에만 완료 처리. 중간 이탈 = 미완료 |
| 퀴즈 재응시 | 허용 (아래 상세) |

---

## 논의 필요 사항: 퀴즈 재응시 처리

**확정**: 같은 세션의 초성퀴즈를 여러 번 풀 수 있음.

**BE가 결정해야 할 것**:

### 1. 저장 방식: INSERT 매번 vs UPSERT

| 방식 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **매번 INSERT** (권장) | 응시할 때마다 새 행 추가 | 응시 이력 추적 가능, 최고점/최근점/평균 등 다양한 집계 가능 | 행이 쌓임 (세션당 최대 수십 건 수준이라 문제 없음) |
| **UPSERT (session_id 기준)** | 같은 세션이면 덮어씀 | 행 1개로 깔끔 | 이전 시도 기록 유실, "최고점 기준" 구현 시 FE가 비교 후 호출해야 함 |

**권장: 매번 INSERT** → 별 판정 시 `MAX(correct_count)` 사용

### 2. 별 판정 기준: 최고점 vs 최근점

| 기준 | 설명 | UX 성격 |
|------|------|---------|
| **최고점 (MAX)** (권장) | 한 번이라도 4/5 이상 맞으면 별 획득 | 달성형 — 한번 얻으면 유지. 재도전 동기 부여 |
| **최근점 (latest)** | 가장 최근 응시 기준 | 유지형 — 나중에 못 맞으면 별 사라짐. 긴장감 |

**권장: 최고점** → 유저가 복습 효과를 느끼며 별을 모으는 게 목적이므로 달성형이 적합

### 3. UNIQUE 제약 여부

매번 INSERT 방식이면 `(user_id, session_id)`에 UNIQUE 제약 **걸지 않음**.
대신 진척도 조회 시:
```sql
SELECT MAX(correct_count) >= 4 AS passed
FROM chosung_quiz_result
WHERE session_id = :session_id;
```
