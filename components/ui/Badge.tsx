import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "positive" | "negative" | "warning" | "brand";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-text-secondary",
  positive: "bg-green-50 text-positive",
  negative: "bg-red-50 text-negative",
  warning: "bg-amber-50 text-amber-600",
  brand: "bg-blue-50 text-brand-blue",
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
