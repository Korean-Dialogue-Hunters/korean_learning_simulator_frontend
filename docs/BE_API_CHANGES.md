# BE API 변경사항 정리 (2026-04-16) - v2.0

## 개요

세션 진척도 표시를 위한 별 3개 시스템 구현을 위해 다음과 같은 BE 변경사항이 적용되었습니다.

- **테이블**: `history_stars` (기존 테이블 사용)
- **목적**: 초성퀴즈 결과와 플래시카드 완료 상태를 저장하여 세션별 진척도를 계산
- **변경사항**: 세션 끝 시점에 자동으로 `chosung_total_count`, `flash_total_count`, `grade` 저장

## 데이터 저장 흐름

### 세션 완료 시 자동 저장

1. **세션 끝** → `save_evaluation()` → evaluation 테이블에 grade 저장
2. **동시에** → `save_chosung_quiz()` → 초성퀴즈 데이터 + `history_stars`에 `chosung_total_count`, `grade` 저장
3. **동시에** → `save_flashcards()` → 플래시카드 데이터 + `history_stars`에 `flash_total_count`, `grade` 저장

### 결과 제출 시 업데이트

4. **초성퀴즈 결과 제출** → `history_stars`에 `chosung_correct_count` 업데이트
5. **플래시카드 완료 제출** → `history_stars`에 `flash_completed_count` 업데이트

## API 엔드포인트

### 1. 초성퀴즈 결과 저장

**엔드포인트**: `POST /v1/users/{user_nickname}/review/quiz-result`

**요청 본문** (변경됨):
```json
{
  "sessionId": "string",
  "correctCount": 4
}
```

**응답 (201 Created)**:
```json
{
  "sessionId": "string",
  "correctCount": 4,
  "totalCount": 5,
  "passed": true
}
```

**설명**:
- 초성퀴즈를 풀고 난 후 맞은 개수만 전송
- `totalCount`는 세션 끝 시점에 자동 저장된 값 사용
- `history_stars` 테이블에 `chosung_correct_count` 업데이트

### 2. 플래시카드 완료 상태 저장

**엔드포인트**: `POST /v1/users/{user_nickname}/review/flashcard-result`

**요청 본문** (변경됨):
```json
{
  "sessionId": "string",
  "completedCount": 5
}
```

**응답 (201 Created)**:
```json
{
  "sessionId": "string",
  "completedCount": 5,
  "totalCount": 5,
  "allDone": true
}
```

**설명**:
- 플래시카드 암기 완료 개수만 전송
- `totalCount`는 세션 끝 시점에 자동 저장된 값 사용
- `history_stars` 테이블에 `flash_completed_count` 업데이트

## 데이터베이스 테이블 구조

### `history_stars` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint | Primary Key (자동 생성) |
| created_at | timestamptz | 생성 시각 |
| session_id | text | 세션 ID (FK) |
| grade | text | 평가 등급 (예: "Beginner <S>") |
| chosung_correct_count | integer | 초성퀴즈 맞은 개수 |
| chosung_total_count | integer | 초성퀴즈 전체 개수 |
| flash_completed_count | integer | 플래시카드 완료 개수 |
| flash_total_count | integer | 플래시카드 전체 개수 |

**특징**:
- 하나의 row에 초성퀴즈와 플래시카드 결과가 모두 저장됩니다.
- Upsert 방식으로 중복 호출 시 덮어쓰기 됩니다.
- 각 세션당 최대 1개의 row가 존재합니다.

## 진척도 계산 로직

### 별 3개 조건

| 별 | 조건 | 데이터 출처 | 계산 방식 |
|----|------|------------|----------|
| ★ 1 | 대화 Grade A 횩득 | `evaluation.grade` | "S" 또는 "A" 포함 여부 |
| ★ 2 | 초성퀴즈 4/5점 이상 | `history_stars` | `chosung_correct_count >= 4` |
| ★ 3 | 플래시카드 전체 완료 | `history_stars` | `flash_completed_count == flash_total_count` |

### 세션 목록 API 변경사항

`GET /v1/users/{nickname}/sessions` 응답에 다음 필드들이 추가될 예정입니다:

```json
{
  "sessions": [
    {
      // ... 기존 필드들 ...
      "chosungQuizPassed": true,    // 초성퀴즈 4점 이상
      "flashcardDone": false        // 플래시카드 모두 완료
    }
  ]
}
```

## 구현 시 주의사항

### 1. 호출 시점
- **세션 완료 시**: 자동으로 `chosung_total_count`, `flash_total_count`, `grade` 저장
- **초성퀴즈 결과 제출 시**: `correctCount`만 전송 (세션 끝 시점에 이미 `totalCount` 저장됨)
- **플래시카드 완료 제출 시**: `completedCount`만 전송 (세션 끝 시점에 이미 `totalCount` 저장됨)

### 2. 재시도 허용
- 같은 세션에 대해 여러 번 호출 가능 (Upsert 방식)
- 최신 데이터로 덮어쓰기 됨

### 3. 에러 처리
- 존재하지 않는 `session_id` → 404 에러 ("세션 기록을 찾을 수 없습니다.")
- 잘못된 파라미터 → 422 에러
- 서버 에러 → 500 에러

### 4. 데이터 일관성
- 세션 끝 시점에 `grade`, `total_count` 값들이 자동 저장됨
- 결과 제출 시 기존 값들을 유지하면서 결과만 업데이트
- 하나의 row에 초성퀴즈와 플래시카드 결과가 모두 저장됨

## 다음 단계

1. **FE 구현**: 위 API들을 호출하도록 수정
   - 세션 완료 시점에 자동 저장되는 데이터 고려
   - API 요청에서 `totalCount` 파라미터 제거
2. **세션 목록 API 확장**: `chosungQuizPassed`, `flashcardDone` 필드 추가
3. **UI 표시**: 세션 카드에 별 3개 표시 로직 구현

## 문의사항

- 초성퀴즈/플래시카드 완료 시점에 대한 구체적인 UX 설계
- 재시도 또는 수정 시 기존 데이터 처리 방식
- 오프라인 상태에서의 데이터 동기화 전략</content>
<parameter name="filePath">c:\Users\GS\Documents\workspace\korean_learning_simulator_backend\BE_API_CHANGES.md