"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { STATUS_COLORS } from "@/components/charts/palette";
import type { MonthProjection } from "@/lib/finance-calculations";

const RANGES = [3, 6, 12] as const;

export function RelatoriosClient({ projection }: { projection: MonthProjection[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(3);
  const data = projection.slice(0, range);

  return (
    <ChartCard
      title="Projeção financeira"
      subtitle="Entradas fixas/recorrentes − gastos fixos/recorrentes − parcelas futuras"
      action={
        <div className="flex gap-1">
          {RANGES.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={range === option ? "primary" : "secondary"}
              onClick={() => setRange(option)}
            >
              {option}m
            </Button>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatCurrency(value)}
            width={90}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "#F8FAFC" }} />
          <Bar dataKey="projectedBalance" name="Saldo projetado" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((month) => (
              <Cell key={month.label} fill={month.isNegative ? STATUS_COLORS.negative : STATUS_COLORS.positive} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
