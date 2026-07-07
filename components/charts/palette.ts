// Paleta categórica validada (ordem fixa — nunca ciclar, nunca reatribuir por rank).
// Ver skill dataviz/references/palette.md. Cores de status (positivo/negativo) usam os
// tons de marca do CasaFlow definidos em app/globals.css, não esta paleta categórica.
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
] as const;

export function colorForIndex(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}

export const STATUS_COLORS = {
  positive: "#16A34A",
  negative: "#DC2626",
  brand: "#2563EB",
};
