import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

type Tone = "neutral" | "positive" | "negative" | "brand";

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: Tone;
  hint?: string;
  icon?: React.ReactNode;
  isCurrency?: boolean;
}

const toneClasses: Record<Tone, string> = {
  neutral: "text-text-primary",
  positive: "text-positive",
  negative: "text-negative",
  brand: "text-brand-blue",
};

export function StatCard({ label, value, tone = "neutral", hint, icon, isCurrency = true }: StatCardProps) {
  const displayValue = typeof value === "number" && isCurrency ? formatCurrency(value) : value;

  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {icon ? <span className="text-text-secondary">{icon}</span> : null}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", toneClasses[tone])}>{displayValue}</p>
      {hint ? <p className="mt-1 text-xs text-text-secondary">{hint}</p> : null}
    </div>
  );
}
