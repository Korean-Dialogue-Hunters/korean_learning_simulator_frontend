"use client";

/* ──────────────────────────────────────────
   RadarChart 내부 구현 (recharts)
   - dynamic import로 SSR 제외됨
   ────────────────────────────────────────── */

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { EvaluationScores } from "@/types/result";

interface RadarChartInnerProps {
  scores: EvaluationScores;
}

export default function RadarChartInner({ scores }: RadarChartInnerProps) {
  const data = [
    { axis: "어휘 (30%)", score: scores.vocabulary, fullMark: 10 },
    { axis: "상황 (50%)", score: scores.situation, fullMark: 10 },
    { axis: "문법 (20%)", score: scores.grammar, fullMark: 10 },
  ];

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-card-border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: "var(--color-tab-inactive)" }}
          />
          <Radar
            name="점수"
            dataKey="score"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
