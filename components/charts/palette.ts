// Paleta categórica vívida (ordem fixa — nunca ciclar, nunca reatribuir por rank).
// Tons "500" escolhidos por lerem bem tanto no tema claro quanto no escuro.
export const CATEGORICAL_PALETTE = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
] as const;

export function colorForIndex(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}

// Referenciam as CSS custom properties de app/globals.css, então se ajustam sozinhas
// entre o tema claro e o escuro.
export const STATUS_COLORS = {
  positive: "var(--positive-strong)",
  negative: "var(--negative-strong)",
  brand: "var(--brand-blue-strong)",
  warning: "var(--warning-strong)",
};

export const CHART_INK = {
  axis: "var(--text-secondary)",
  grid: "var(--border-subtle)",
};

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: 13,
};
