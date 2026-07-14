"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import { CHART_TOOLTIP_STYLE, STATUS_COLORS } from "./palette";

export interface MonthlyBalancePoint {
  label: string;
  balance: number;
}

export function MonthlyEvolutionChart({ data }: { data: MonthlyBalancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STATUS_COLORS.brand} stopOpacity={0.3} />
            <stop offset="100%" stopColor={STATUS_COLORS.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={{ stroke: "var(--border-subtle)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
          width={90}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={STATUS_COLORS.brand}
          strokeWidth={2.5}
          fill="url(#balanceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
