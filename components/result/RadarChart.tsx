"use client";

/* ──────────────────────────────────────────
   방사형(레이더) 그래프 컴포넌트 — TODO #49~#51
   - 어휘(30%) / 상황(50%) / 문법(20%) 3축
   - recharts 라이브러리 사용
   - 클라이언트 전용 (dynamic import)
   ────────────────────────────────────────── */

import dynamic from "next/dynamic";
import { EvaluationScores } from "@/types/result";

interface RadarChartProps {
  scores: EvaluationScores;
}

/* recharts는 SSR 비호환 → dynamic import */
const RadarChartInner = dynamic(() => import("./RadarChartInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-52 flex items-center justify-center">
      <p className="text-xs text-tab-inactive">차트 로딩 중...</p>
    </div>
  ),
});

export default function RadarChart({ scores }: RadarChartProps) {
  return <RadarChartInner scores={scores} />;
}
