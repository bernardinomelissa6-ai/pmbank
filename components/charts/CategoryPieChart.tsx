"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "./palette";

export interface CategorySlice {
  name: string;
  value: number;
}

export function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-secondary">
        Sem gastos no período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colorForIndex(index)} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, color: "#64748B" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
