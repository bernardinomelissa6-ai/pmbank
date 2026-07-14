"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import { CHART_TOOLTIP_STYLE, colorForIndex } from "./palette";

export interface PersonSlice {
  name: string;
  value: number;
}

export function PersonBarChart({ data }: { data: PersonSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-secondary">
        Sem gastos no período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
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
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "var(--surface-hover)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colorForIndex(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
