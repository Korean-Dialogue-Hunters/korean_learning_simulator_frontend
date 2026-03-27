# 009 — onboarding→setup 리네이밍 + 홈 화면 리디자인

## 작업 요약

"온보딩" 관련 파일명·타입명·함수명·localStorage 키를 전부 "setup"으로 교체하고,
홈 화면 및 전체 앱의 라이트 모드를 따뜻한 베이지/머스타드 톤으로 리디자인했습니다.

---

## 주요 변경 사항

### 1. 전체 리네이밍 (onboarding → setup)

| 변경 전 | 변경 후 |
|---------|---------|
| `types/onboarding.ts` | `types/setup.ts` |
| `hooks/useOnboarding.ts` | `hooks/useSetup.ts` |
| `lib/onboardingValidation.ts` | `lib/setupValidation.ts` |
| `__tests__/onboardingValidation.test.ts` | `__tests__/setupValidation.test.ts` |
| `OnboardingProfile` 타입 | `SetupProfile` |
| `OnboardingStep` 타입 | `SetupStep` |
| `useOnboarding()` 훅 | `useSetup()` |
| `isOnboardingDone()` | `isSetupDone()` |
| `validateOnboardingProfile()` | `validateSetupProfile()` |
| localStorage `onboardingDone` | `setupDone` |
| localStorage `onboardingProfile` | `setupProfile` |

모든 import 경로 + 주석도 일괄 교체 완료.

### 2. 홈 화면 리디자인

**라이트 모드 컬러 변경** (`globals.css`)
- 배경: `#FFFFFF` → `#F5F0E8` (따뜻한 베이지)
- 카드: `#F5F5F5` → `#FFFFFF` (흰색 카드 on 베이지 배경)
- 액센트: `#EF9F27` → `#D4A843` (머스타드)

**HomeHeader** — 테마 토글을 lucide `Sun`/`Moon` 아이콘 + 카드 스타일 버튼으로 변경

**TierCard** — `Trophy` 아이콘 추가, 간격 확대, 부드러운 그림자

**WeeklyStats** — `MessageCircle`/`Star`/`Flame` lucide 아이콘 추가

**BottomTabBar** — 이모지 → lucide 라인 아이콘 (`Home`/`MessageCircle`/`ClipboardList`/`BookOpen`/`User`)

**CTA 버튼** — `bg-btn-primary` + 머스타드 그림자로 변경

---

## 변경된 파일 목록

| 파일 | 역할 |
|------|------|
| `types/setup.ts` | 신규 (기존 onboarding.ts 대체) |
| `hooks/useSetup.ts` | 신규 (기존 useOnboarding.ts 대체) |
| `lib/setupValidation.ts` | 신규 (기존 onboardingValidation.ts 대체) |
| `__tests__/setupValidation.test.ts` | 신규 (기존 테스트 대체) |
| `app/globals.css` | 라이트 모드 컬러를 따뜻한 톤으로 변경 |
| `components/HomeHeader.tsx` | lucide 아이콘 + 스타일 변경 |
| `components/TierCard.tsx` | 트로피 아이콘 + 레이아웃 개선 |
| `components/WeeklyStats.tsx` | lucide 아이콘 추가 |
| `components/BottomTabBar.tsx` | lucide 라인 아이콘으로 교체 |
| `app/page.tsx` | import 교체 + CTA 스타일 변경 |
| `app/setup/page.tsx` | import 교체 |
| `app/location/page.tsx` | import 교체 |
| `components/setup/*.tsx` (5개) | import 교체 |
| `docs/PLAN.md` | v1.2 디자인 변경 이력 추가 |

## 삭제된 파일

- `types/onboarding.ts`
- `hooks/useOnboarding.ts`
- `lib/onboardingValidation.ts`
- `__tests__/onboardingValidation.test.ts`

---

## 용어 참조

| 용어 | 설명 |
|------|------|
| **리네이밍** | 파일명·변수명·함수명 등을 일괄적으로 이름 변경하는 작업 |
| **localStorage 키** | 브라우저에 데이터를 저장할 때 사용하는 고유 이름표. 키가 바뀌면 이전 데이터는 읽히지 않음 |
| **CSS 변수 오버라이드** | 같은 변수명을 조건별로 다른 값으로 재정의하는 기법. 다크/라이트 모드 전환에 활용 |
