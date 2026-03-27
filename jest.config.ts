/* ──────────────────────────────────────────
   Jest 설정 파일
   - ts-jest: TypeScript 파일을 Jest에서 실행 가능하게 변환
   - moduleNameMapper: Next.js의 @/ 경로 별칭을 Jest에서도 인식하도록 설정
   ────────────────────────────────────────── */

import type { Config } from "jest";

const config: Config = {
  // ts-jest: TypeScript 코드를 Jest가 이해할 수 있게 변환해주는 도구
  preset: "ts-jest",
  // jsdom: 브라우저 환경을 시뮬레이션 (localStorage 등 사용 가능)
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    // Next.js에서 @/는 프로젝트 루트(src/ 또는 /)를 의미
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default config;
