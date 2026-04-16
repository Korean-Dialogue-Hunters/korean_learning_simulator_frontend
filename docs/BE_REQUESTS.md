# BE 요청 사항

> FE 작업 중 BE 담당자에게 전달할 작업 항목 모음.
> 각 항목은 그대로 복사해서 전달 가능한 형태로 작성됨.
> 처리 완료된 항목은 ✅ 표시 후 하단 "완료" 섹션으로 이동.

---

## 🔴 진행 중

### BE-01: 신규 유저 자동 생성 (FE 셋업 → BE user insert)

**관련 FE TODO**: T1-01

**현재 문제**
- FE 셋업 완료 시점에 `users` 테이블에 insert가 일어나지 않음
- 결과적으로 `GET /v1/users/{nickname}/sessions`, `/profile`, `/weekly-stats` 등 모든 user 기반 엔드포인트가 신규 유저에게 `404 user profile not found` 응답
- FE는 임시로 404를 빈 상태로 처리 중이지만, 정상 흐름은 아님

**요청**
다음 둘 중 하나로 처리:

**옵션 A — 명시적 user 생성 엔드포인트 신설 (권장)**
```
POST /v1/users
Content-Type: application/json

Request body:
{
  "userId": "uuid-string",          // FE에서 crypto.randomUUID() 생성
  "userNickname": "string",
  "country": "string",              // ISO 3166-1 alpha-2 (예: "KR", "US")
  "koreanLevel": "초급" | "중급" | "고급",
  "culturalInterest": ["string"]    // 다중 선택
}

Response (201 Created):
{
  "userId": "uuid-string",
  "userNickname": "string",
  "country": "string",
  "koreanLevel": "string",
  "culturalInterest": ["string"],
  "latestGrade": ""                 // 신규는 빈 문자열
}

에러:
- 409 Conflict — 닉네임 중복 시
```

FE는 셋업 완료 시점 (`saveProfile()`)에 이 엔드포인트 호출.

**옵션 B — 첫 세션 생성 시 BE에서 자동 upsert**

`POST /v1/sessions` 내부에서 `userNickname`이 DB에 없으면 자동으로 insert.
단점: profile 정보(country, koreanLevel, culturalInterest)를 세션 생성 요청에서 같이 받아야 함. 현재 `CreateSessionRequest`에 이미 `userId`, `culturalInterest`가 있으니 country/koreanLevel만 추가하면 됨.

**FE 측 후속**
- 옵션 A 채택 시: `lib/api.ts`에 `createUser()` 함수 추가, `hooks/useSetup.ts` `saveProfile()`에서 호출
- 옵션 B 채택 시: 별도 호출 없음, 세션 생성 시 자동 처리

**선호**: 옵션 A (책임 분리, 셋업 단계에서 명확히 유저 등록)

---

### BE-02: `WeeklyReviewResponse` 응답 경량화

**관련 FE TODO**: T1-03

**현재 문제**
`GET /v1/users/{nickname}/review/weekly` 응답이 LangGraph `ReviewState` 덤프 그대로 노출됨. `build_weekly_review`(`learning_orchestrator.py:598,606`)가 `review_graph.invoke()` 결과를 거의 그대로 반환하는 구조 때문.

**필드 진단**

| 필드 | 성격 | FE 사용 | 조치 |
|---|---|---|---|
| `userProfile` | 그래프 입력값 누수 | ❌ | 제거 |
| `justBeforeSession` | 그래프 입력값 누수 + `conversation_log` 전체 포함 (페이로드 무거움) | ❌ | 제거 |
| `wrongWordPool` | 중간 산출물 누수 | ❌ | 제거 |
| `chosungQuiz` | 최종 산출물 | ✅ | 유지 |
| `flashcards` | 최종 산출물 | ✅ | 유지 |

**상세**
- `userProfile`: 그래프 내부 노드들이 한국어 수준 참조용으로 `ReviewState`에 넣어둔 입력값. `learning_orchestrator.py:616 _persist_review_artifacts`에서 `session_state["user_profile"]` 그대로 복사. 응답 노출은 `review_graph.invoke(state)`가 입력 상태 포함 dict 반환하기 때문.
- `justBeforeSession`: 이름은 list지만 항상 원소 1개. `generate_flashcards.py:225`(명사 토크나이징), `generate_chosung_quiz.py:500`(퀴즈 소재), `ui.py:444`(Gradio weak_count 표시)에서 내부 사용. `conversation_log` 전체가 들어가 페이로드 큼.
- `wrongWordPool`: `generate_flashcards.py:253`에서 LLM 교정 경로 분기용 플래그로만 사용. 실제 데이터는 `just_before_session[0].wrong_words`에서 다시 파싱하므로 중복.

**요청**
1. `app/services/learning_orchestrator.py build_weekly_review`가 `review_graph.invoke()` 결과에서 `chosung_quiz`, `flashcards`만 추출하여 명시 매핑
2. `app/schemas/user.py WeeklyReviewResponse` Pydantic 스키마에서 `user_profile`, `just_before_session`, `wrong_word_pool` 3개 필드 제거
3. 그래프 내부 노드들은 `ReviewState`를 그대로 사용 (응답 직렬화 시점에만 필터링)

**기대 효과**
- 페이로드 대폭 축소 (`conversation_log` 전체가 빠짐)
- API 계약 명확화 (내부 상태 누수 제거)

**FE 측 후속**
배포 후 FE에서 `types/api.ts WeeklyReviewResponse` 타입에서 3개 필드 제거 (T1-04).

---

## ✅ 완료

- **BE-03** 평가 응답 언어 파라미터 (`?lang=ko|en`) — BE 반영 완료, FE `evaluateSession(sessionId, lang)` 사용 중
- **BE-04** 페르소나/시나리오 영문 필드 (`roleEn`/`missionEn`/`genderEn`/`sceneEn`) — BE 반영 완료, `lib/api.ts normalizePersonas`에서 snake_case → camelCase 정규화 처리
