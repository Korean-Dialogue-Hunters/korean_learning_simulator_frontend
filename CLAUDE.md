@AGENTS.md

## Workflow rules

- **main은 배포 브랜치 — 직접 작업/PR 금지.** 모든 변경은 `dev`에서 분기한 `feat/*` `fix/*` `docs/*` 브랜치에서 → **PR base는 항상 `dev`**. `main`은 별도 일정에 `dev`를 일괄 머지해서 배포. Claude가 바로 `main`에 머지하지 말 것.
- **dev(또는 main) 머지 전 항상 `npm run build` 실행.** 빌드 깨진 채로 올라가면 안 됨. PR 만들기 전, 머지 직전 둘 다 통과 확인.
