"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface DailyRevenuePoint {
  /** ISO yyyy-mm-dd */
  date: string;
  /** Short label like "May 12" */
  label: string;
  revenue: number;
  bookings: number;
}

interface Props {
  data: DailyRevenuePoint[];
}

function compactCurrency(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}k`;
  return `₱${value}`;
}

interface TooltipPayload {
  payload: DailyRevenuePoint;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-medium text-neutral-900 dark:text-white">{point.label}</p>
      <p className="text-amber-600 font-semibold mt-0.5">{formatCurrency(point.revenue)}</p>
      <p className="text-neutral-500">
        {point.bookings} {point.bookings === 1 ? "event" : "events"}
      </p>
    </div>
  );
}

export function RevenueTrendChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          No revenue in the last 30 days
        </p>
        <p className="text-xs text-neutral-400 max-w-xs text-center">
          Revenue accrues on the day of the event for bookings marked PAID or COMPLETED.
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-neutral-500"
          />
          <YAxis
            tickFormatter={compactCurrency}
            tick={{ fontSize: 11 }}
            width={56}
            stroke="currentColor"
            className="text-neutral-500"
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(217, 119, 6, 0.08)" }} />
          <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
