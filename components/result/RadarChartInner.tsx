"use client";

/* ──────────────────────────────────────────
   RadarChart 내부 구현 (recharts) — 5축
   - dynamic import로 SSR 제외됨
   - 커스텀 툴팁: hover 시 점수 표시, 영역 밖 나가면 사라짐
   ────────────────────────────────────────── */

import { useState, useCallback } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { EvaluationScores } from "@/types/result";

interface RadarChartInnerProps {
  scores: EvaluationScores;
}

export default function RadarChartInner({ scores }: RadarChartInnerProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<{ axis: string; score: number } | null>(null);

  const data = [
    { axis: t("eval.length"), score: scores.length, fullMark: 10 },
    { axis: t("eval.vocab"), score: scores.vocabulary, fullMark: 10 },
    { axis: t("eval.sceneMission"), score: scores.sceneMission, fullMark: 10 },
    { axis: t("eval.relationship"), score: scores.relationship, fullMark: 10 },
    { axis: t("eval.spelling"), score: scores.spelling, fullMark: 10 },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.[0]) {
      setHovered(state.activePayload[0].payload);
    } else if (state?.activeLabel) {
      /* 축 라벨 위에 호버 — activeLabel로 매칭 */
      const found = data.find((d) => d.axis === state.activeLabel);
      if (found) setHovered(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, []);

  return (
    <div className="relative w-full h-64" onMouseLeave={handleMouseLeave}>
      {/* 호버 툴팁 */}
      {hovered && (
        <div className="absolute top-2 right-2 z-10 px-3 py-1.5 rounded-xl text-xs pointer-events-none"
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
          <span className="text-tab-inactive">{hovered.axis}</span>
          <span className="ml-2 font-bold text-foreground">{hovered.score.toFixed(1)}</span>
          <span className="text-tab-inactive"> / 10</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={undefined}>
          <PolarGrid stroke="var(--color-card-border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 10, fill: "var(--color-tab-inactive)", style: { cursor: "default" } }}
          />
          <PolarRadiusAxis domain={[0, 10]} ticks={[3.33, 6.67, 10]} tick={false} axisLine={false} />
          {/* 기본 Tooltip 완전 비활성화 — 검정 박스 제거 */}
          <Tooltip content={() => null} />
          <Radar
            name="점수"
            dataKey="score"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
            activeDot={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
