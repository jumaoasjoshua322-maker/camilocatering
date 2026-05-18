"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  data: { d: string; v: number }[];
  color?: string;
}

/**
 * Tiny decorative trend line for KPI tiles. No axes, no tooltip.
 * Pass roughly 10–30 points; recharts handles spacing.
 */
export function KpiSparkline({ data, color = "currentColor" }: Props) {
  if (!data?.length) return <div className="h-8" />;
  return (
    <div className="h-8 w-full -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
