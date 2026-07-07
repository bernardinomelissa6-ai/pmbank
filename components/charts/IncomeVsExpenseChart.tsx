"use client";

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import { STATUS_COLORS } from "./palette";

export interface IncomeExpensePoint {
  label: string;
  income: number;
  expense: number;
}

export function IncomeVsExpenseChart({ data }: { data: IncomeExpensePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
          width={90}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "#F8FAFC" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#64748B" }} />
        <Bar dataKey="income" name="Entradas" fill={STATUS_COLORS.positive} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Gastos" fill={STATUS_COLORS.negative} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
