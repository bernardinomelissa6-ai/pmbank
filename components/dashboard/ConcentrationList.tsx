import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "@/components/charts/palette";

export interface ConcentrationItem {
  name: string;
  value: number;
  hint?: string;
}

export function ConcentrationList({ items, total }: { items: ConcentrationItem[]; total: number }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">Sem gastos no período.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <li key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-text-primary">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorForIndex(index) }}
                />
                <span className="truncate">{item.name}</span>
                {item.hint ? <span className="shrink-0 text-xs text-text-secondary">{item.hint}</span> : null}
              </span>
              <span className="shrink-0 text-text-secondary">
                {formatCurrency(item.value)} · {percent.toFixed(0)}%
              </span>
            </div>
            <ProgressBar value={percent} />
          </li>
        );
      })}
    </ul>
  );
}
