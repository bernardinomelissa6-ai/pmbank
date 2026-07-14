import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "positive" | "negative" | "warning" | "brand";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-text-secondary/10 text-text-secondary",
  positive: "bg-positive/10 text-positive",
  negative: "bg-negative/10 text-negative",
  warning: "bg-warning/15 text-warning",
  brand: "bg-brand-blue/10 text-brand-blue",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}

export const STATUS_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  expected: { label: "Previsto", tone: "brand" },
  received: { label: "Recebido", tone: "positive" },
  open: { label: "Em aberto", tone: "warning" },
  paid: { label: "Pago", tone: "positive" },
  late: { label: "Atrasado", tone: "negative" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  active: { label: "Ativo", tone: "positive" },
  inactive: { label: "Inativo", tone: "neutral" },
  completed: { label: "Concluída", tone: "positive" },
  paused: { label: "Pausada", tone: "warning" },
};
