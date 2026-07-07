"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "./palette";

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
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
          width={90}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "#F8FAFC" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colorForIndex(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
