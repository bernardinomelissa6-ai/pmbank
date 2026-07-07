import { formatCurrency } from "@/lib/format";

export interface PersonSummaryRow {
  personId: string;
  personName: string;
  total: number;
}

export function PersonSummaryTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: PersonSummaryRow[];
}) {
  const familyTotal = rows.reduce((acc, row) => acc + row.total, 0);

  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {subtitle ? <p className="text-xs text-text-secondary">{subtitle}</p> : null}
      <div className="mt-3 flex flex-col divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.personId} className="flex items-center justify-between py-2 text-sm">
            <span className="text-text-secondary">{row.personName}</span>
            <span className="font-medium text-text-primary">{formatCurrency(row.total)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-2 text-sm font-semibold">
          <span className="text-text-primary">Família</span>
          <span className="text-brand-blue">{formatCurrency(familyTotal)}</span>
        </div>
      </div>
    </div>
  );
}
