# 트랙 5 — Korean Level 시스템: BE 요청 정리

> **최초 작성**: 2026-04-16
> **개정**: 2026-04-17 — BE 현행 코드 재검증 후 이미 완료된 항목 제거, 실제 남은 작업만 정리
> **검증 근거**: `korean_learning_simulator_backend` 레포 코드 + `BE_API_CHANGES.md` (2026-04-16)
> **FE TODO 참조**: `docs/TODO.md` 트랙 5 (T5-01 ~ T5-10)

---

## 0. TL;DR — 무엇이 남았는가

| 항목 | 상태 |
|------|------|
| ✅ `user_profile.korean_level` 정수 필드 | **이미 존재** (`models.py:101`, `schemas/user.py:29`) |
| ✅ `CreateSessionRequest` 정수/문자열 양쪽 수용 | **이미 존재** (`schemas/session.py:123–159` `normalize_korean_level` 밸리데이터) |
| ✅ `session.korean_level` 정수 저장 | **이미 존재** (`models.py:15` `Literal[1,2,3,4,5,6]`) |
| ✅ 시험 대화 합격 판정 함수 | **이미 존재** (`domain/exam/scoring.py` `is_conversation_passed` ≥ 8.0) |
| ✅ 평균/저점 세션 헬퍼 | **이미 존재** (`supabase_repository.get_average_score_by_user`, `get_low_score_sessions`, `get_sessions_by_user`) |
| 🚧 `ExamOrchestrator.continue_turn()` | **스텁 (`pass`)** — 대화 이어받기 미구현 |
| ❌ 승급 자격 판정 엔드포인트 | **없음** — `/level-up/eligibility` 라우터 자체 부재 |
| ❌ 승급 시험 세션 생성/결과 엔드포인트 | **없음** — `exam_orchestrator`는 라우터 미연결 |
| ❌ 강등 판정 로직 | **없음** — 평가 후 `korean_level` 조정 플로우 없음 |
| ❌ `EvaluationResponse.level_changed`·`new_level` | **없음** (`schemas/session.py:246` 기준) |
| ➖ 레벨 변경 이력 테이블 | **없음** (선택 과제) |

FE 기준 트랙 5 파생 영향:
- **지금 당장 FE에서 가능**: `POST /v1/sessions` 페이로드를 문자열 → 정수로 전환해도 BE가 정규화(validator)로 받음. 정수 전환은 BE 변경 없이 가능하지만, 먼저 `user_profile.korean_level` (정수) 응답을 소비해서 그 값을 보내는 방향으로 통합하는 게 깔끔함.
- **FE 대기**: eligibility / exam / demotion 엔드포인트.

---

## 1. 이미 처리된 항목 (요청 취소)

### ~~BE-T5-01: `user_profile.korean_level` 정수 필드 추가~~
- **상태**: ✅ 이미 반영됨
- **근거**:
  - `app/infra/persistence/models.py:101` — `UserProfileRecord.korean_level: int = 1`
  - `app/schemas/user.py:29` — `UserProfileResponse.korean_level: int`
- **FE 대응**: `types/api.ts UserProfileResponse.koreanLevel: string | number`로 확장 완료 (2026-04-17).
  Supabase 마이그레이션 이력/기본값은 BE가 이미 적용했다고 간주.

### ~~BE-T5-06: 세션 생성 시 `korean_level` 정수 매핑~~
- **상태**: ✅ 이미 반영됨
- **근거**: `app/schemas/session.py:123–159` `CreateSessionRequest.korean_level: int` + `@field_validator("korean_level", mode="before")` → `_LEVEL_MAP`이 `"초급"/"중급"/"고급"/"Beginner"/"Intermediate"/"Advanced"/"1급"~"6급"/1~6` 모두 1~6 정수로 정규화.
- **FE 대응 (선택)**: 현재 FE는 `"초급"/"중급"/"고급"` 문자열을 그대로 전송. 동작엔 문제 없음. 추후 `user_profile.korean_level` (정수) 응답을 받아 그 값을 그대로 넘기도록 바꾸면 됨.

---

## 2. 남은 BE 작업 (우선순위 순)

### BE-T5-02: 승급 자격 판정 API 🆕 남음

**대응 FE TODO**: T5-04 / T5-06

**엔드포인트 제안**: `GET /v1/users/{user_nickname}/level-up/eligibility`

**로직**:
1. `user_profile.korean_level` 조회
2. 현재 레벨에서 완료한 세션 수 카운트 (`session.korean_level`가 이미 정수 `Literal[1~6]`이라 필터 단순)
3. 최근 5회 세션의 `total_score_10` 평균 (`evaluation` 조인)
4. 자격 조건:
   - `completed_sessions >= 5` AND `avg_score >= 8.0`
   - 이미 최고 레벨(6)이면 항상 `eligible=false`

**응답 스키마 (제안)**:
```json
{
  "currentLevel": 2,
  "nextLevel": 3,
  "eligible": false,
  "completedSessions": 3,
  "requiredSessions": 5,
  "averageScore": 7.2,
  "requiredScore": 8.0
}
```

**재활용 가능한 BE 유틸**:
- `supabase_repository.get_sessions_by_user` (519행)
- `supabase_repository.get_average_score_by_user` (685행)
- 두 메서드 모두 `korean_level` 필터 옵션만 추가하면 됨

**설계 포인트**: 조건 미달 시에도 진행 상황 반환 → FE에서 "N회 더", "평균 N점 부족" 안내용.

---

### BE-T5-03: 승급 시험 엔드포인트 🆕 남음 (스텁 확장)

**대응 FE TODO**: T5-05 / T5-06

**현재 BE 상태**: `app/usecases/exam_orchestrator.py`에 스캐폴드가 있으나
- `create_exam_session`은 구현되어 있음 (`target_level = current_level + 1`로 대화 그래프 invoke)
- `continue_turn`은 `pass`로 비어있음 ❌
- `evaluate_exam_conversation`은 구현되어 있으나 `is_conversation_passed` 기준이 ≥ 8.0 (아래 "논의 필요" 참조)
- **FastAPI 라우터에 아무 엔드포인트도 노출돼 있지 않음** (`app/api/sessions.py` / `users.py` 어디에도 없음)

**요청**:
1. `continue_turn` 구현 (기존 `learning_orchestrator` 턴 진행 로직 재활용 — 핵심은 같은 conversation_graph 이어서 호출 + 상태 캐시 업데이트)
2. 라우터 신설:
   - `POST /v1/users/{user_nickname}/level-up/exam` — 시험 세션 생성 (내부: `ExamOrchestrator.create_exam_session`)
     - 자격 조건 재검증 후 진행 (`eligibility=true` 재확인)
     - 응답은 기존 `CreateSessionResponse`와 동일 + `examSessionId`
     - 세션에 `is_exam: true` 플래그 (일반 세션 통계/강등 계산에서 제외)
   - `POST /v1/sessions/{session_id}/turns` — 기존 턴 API 재활용 가능 (단, `is_exam` 분기)
   - `POST /v1/users/{user_nickname}/level-up/result` — 결과 판정 + `user_profile.korean_level += 1`

**응답 스키마 (결과 제안)**:
```json
{
  "passed": true,
  "totalScore": 8.5,
  "grade": "A",
  "previousLevel": 2,
  "newLevel": 3
}
```

**논의 필요**:
- 합격 기준 통일: `is_conversation_passed` ≥ 8.0 (S 등급급) vs Grade A ≥ 7.1. **둘 중 무엇을 승급 기준으로?**
- 시험 세션은 일반 세션 평균/강등 판정에 **포함하지 않는다**는 원칙 (`is_exam` 플래그로 필터).

---

### BE-T5-04: 강등 판정 로직 🆕 남음

**대응 FE TODO**: T5-09 / T5-10

**권장 구현**: 방식 A — `POST /v1/sessions/{session_id}/evaluation` 완료 후 내부에서 자동 체크

**로직**:
1. 평가 저장 직후 현재 유저의 **같은 레벨** 최근 3회 일반 세션(`is_exam=false`) 조회
2. 3회 미만이면 스킵
3. 평균 `total_score_10` ≤ 5.0 → `user_profile.korean_level -= 1` (최소 1)
4. 레벨 변경 시점에 평균 측정 리셋 (해당 유저의 `korean_level` 변경 시점 이후 세션만 카운트되도록)

**EvaluationResponse 스키마 추가**:
```diff
class EvaluationResponse(CamelModel):
    ...
    SCK_level_word_counts: dict[str, Any] = ...
+   level_changed: bool = Field(False, description="평가 후 레벨 변경 여부")
+   new_level: int | None = Field(None, description="변경된 후 레벨 (변경시에만)")
+   previous_level: int | None = Field(None, description="변경 전 레벨 (변경시에만)")
```

**재활용 가능한 BE 유틸**:
- `supabase_repository.get_low_score_sessions` (625행) — 저점 필터 이미 존재
- `korean_level` 필터 + `is_exam=false` 필터만 추가

**FE 영향**: FE `EvaluationResponse` 타입에 `levelChanged?`/`newLevel?`/`previousLevel?` 옵셔널 필드 추가, `/feedback` 페이지에서 감지 시 모달/토스트.

---

### BE-T5-05: 레벨 변경 이력 테이블 (선택)

**대응 FE TODO**: T5-09 / T5-10 보조

**권장이지만 필수 아님** — 승급/강등 내역 추적, 디버깅, 추후 유저 레벨 이력 화면용.

```sql
CREATE TABLE user_level_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  old_level INT NOT NULL,
  new_level INT NOT NULL,
  reason VARCHAR(20) NOT NULL,  -- 'level_up' / 'demotion' / 'initial'
  session_id UUID,              -- 변경 트리거 세션 (승급 시험 or 저점 세션)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**FE 영향**: 당장 없음. 추후 레벨 이력 화면 만들 때 활용.

---

## 3. 요약: 남은 BE 작업 우선순위

| 순서 | 요청 ID | 내용 | 난이도 | 선결 |
|------|---------|------|--------|------|
| 1 | BE-T5-02 | 승급 자격 판정 API | 중간 | 없음 (필요 헬퍼 전부 존재) |
| 2 | BE-T5-03 | 승급 시험 라우터 + `continue_turn` 구현 | 높음 | BE-T5-02 |
| 3 | BE-T5-04 | 강등 판정 (평가 자동 + `EvaluationResponse` 확장) | 중간 | 없음 |
| 4 | BE-T5-05 | 레벨 변경 이력 테이블 | 낮음 | 선택 |

---

## 4. 논의 필요 사항

1. **승급 합격 기준**: `is_conversation_passed` ≥ 8.0 유지? 아니면 Grade A (≥ 7.1)로 완화?
2. **시험 세션 필터링**: `is_exam` 플래그로 모든 평균/강등 계산에서 제외하는 게 맞는지 확정
3. **강등 알림 전달 방식**: `EvaluationResponse`에 인라인으로 넣을지, 별도 `/level-status` 조회 API로 뺄지 (권장: 인라인)
4. **최고 레벨(6급) 유저의 평균 집계 초기화**: 레벨 변경 시점 기준인지, 세션 카운트가 특정 주기로 롤링되는지
