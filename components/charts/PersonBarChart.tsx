"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import { CHART_TOOLTIP_STYLE, STATUS_COLORS } from "./palette";

export interface PersonSlice {
  id: string;
  name: string;
  spent: number;
  remaining: number;
  pending: number;
}

const SERIES = [
  { dataKey: "spent", name: "Gasto", color: STATUS_COLORS.brand },
  { dataKey: "remaining", name: "Sobra", color: STATUS_COLORS.positive },
  { dataKey: "pending", name: "Em aberto", color: STATUS_COLORS.warning },
] as const;

export function PersonBarChart({ data }: { data: PersonSlice[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePersonId = searchParams.get("person");

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-secondary">
        Sem gastos no período.
      </div>
    );
  }

  function handleBarClick(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (activePersonId === id) params.delete("person");
    else params.set("person", id);
    router.push(`${pathname}?${params.toString()}`);
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
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        {SERIES.map((series) => (
          <Bar key={series.dataKey} dataKey={series.dataKey} name={series.name} radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={series.color}
                opacity={activePersonId && activePersonId !== entry.id ? 0.4 : 1}
                cursor="pointer"
                onClick={() => handleBarClick(entry.id)}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
