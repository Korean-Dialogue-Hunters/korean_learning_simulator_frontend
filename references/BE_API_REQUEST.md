# BE API 추가/수정 요청

FE 기록 탭, 내정보 탭, 대화 화면 기능을 위해 필요한 API입니다.

---

## 1. [신규] 유저 세션 목록 조회

사용자의 전체 대화 세션 목록을 조회합니다. 기록 탭(Dialogue History)에서 사용합니다.

```
GET /v1/users/{user_nickname}/sessions
```

**완료된 세션만 반환** (`is_finished=true`인 것만). 미완료 대화는 포함하지 않습니다.

### Query Parameters (선택)
| 파라미터 | 타입 | 설명 | 예시 |
|---------|------|------|------|
| `sort` | string | 정렬 기준 | `recent`, `oldest`, `score_high`, `score_low`, `location` |

### Response
```json
{
  "sessions": [
    {
      "session_id": "abc-123",
      "scenario_title": "한강 자전거길에서 길 찾기",
      "location": "한강",
      "scene": "한강 자전거길에서 길을 잃은 상황",
      "total_score_10": 7.5,
      "grade": "Intermediate <S>",
      "turn_count": 5,
      "turn_limit": 7,
      "created_at": "2026-04-07T14:30:00Z"
    }
  ],
  "total_count": 12
}
```

### 필요한 필드 설명
| 필드 | 용도 |
|------|------|
| `session_id` | 세션 상세 조회, 피드백 재확인 |
| `scenario_title` | 카드에 시나리오 제목 표시 |
| `location` | 맵 기준 정렬 및 위치 뱃지 표시 |
| `scene` | 시나리오 상황 설명 |
| `total_score_10` | 점수 표시 및 정렬 |
| `grade` | 등급 뱃지 표시 |
| `turn_count` | 실제 진행 턴 수 |
| `turn_limit` | 전체 턴 수 |
| ~~`is_finished`~~ | 완료된 세션만 반환하므로 불필요 |
| `created_at` | 날짜 표시 및 시간순 정렬 |

---

## 2. [수정] 유저 프로필 응답 필드 추가

현재 `GET /v1/users/{user_nickname}/profile` 응답에 아래 필드가 빠져 있습니다.

### 추가 요청 필드
| 필드 | 타입 | 설명 |
|------|------|------|
| `korean_level` | string | 한국어 레벨 ("초급", "중급", "고급") — 내정보 탭에서 표시 |

### 수정 후 예시 응답
```json
{
  "userId": "123e4567-...",
  "userNickname": "user123",
  "country": "USA",
  "koreanLevel": "중급",
  "culturalInterest": ["K-media", "K-beauty"],
  "latestGrade": "Beginner <B>"
}
```

---

## 3. [확인] 기존 세션 응답에 `created_at` 추가

현재 `SessionStateResponse`에 `created_at` 필드가 없습니다.
DB에 저장하고 있다면 응답에 포함해주세요.

```
GET /v1/sessions/{session_id}
```

추가 필드:
```json
{
  "created_at": "2026-04-07T14:30:00Z"
}
```

---

## 4. [수정] 주간 통계 응답에 `streak_days` 추가

홈 화면의 스트릭 표시를 위해 `GET /v1/users/{user_nickname}/weekly-stats` 응답에 연속 학습 일수 필드를 추가해주세요.

### 스트릭 계산 로직
- 사용자가 **대화 세션을 완료**(`is_finished=true`)한 시점 기준
- 마지막 완료 시각으로부터 **24시간 이내**에 다시 새로운 세션을 완료하면 streak +1
- 24시간을 초과하면 streak 0으로 리셋
- 예시: 4/6 14:00 완료 → 4/7 13:00 완료 → streak=2 / 4/6 14:00 완료 → 4/8 완료 → streak=1 (리셋)

### 추가 요청 필드
| 필드 | 타입 | 설명 |
|------|------|------|
| `streak_days` | integer | 연속 학습 일수 (24시간 기준) |

### 수정 후 예시 응답
```json
{
  "userId": "123e4567-...",
  "userNickname": "user123",
  "conversationCount": 5,
  "averageScore": 87.5,
  "latestGrade": "Beginner <B>",
  "streakDays": 3
}
```

---

## 우선순위

1. **필수**: `GET /v1/users/{nickname}/sessions` (기록 탭 핵심)
2. **필수**: `created_at` 필드 (정렬에 필요)
3. **필수**: `streak_days` 필드 (홈 화면 스트릭)
4. **권장**: `korean_level` 프로필 필드 (내정보 탭)
