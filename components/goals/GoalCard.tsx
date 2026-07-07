import { Badge, STATUS_BADGE } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { goalProgress, goalSuggestedMonthly } from "@/lib/finance-calculations";
import type { FinancialGoal } from "@/types/database";

export function GoalCard({
  goal,
  canManage,
  onEdit,
  onDelete,
}: {
  goal: FinancialGoal;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = goalProgress(goal);
  const suggestedMonthly = goalSuggestedMonthly(goal);

  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-text-primary">{goal.name}</p>
          <p className="text-xs text-text-secondary">
            {goal.deadline ? `Até ${formatDate(goal.deadline)}` : "Sem prazo definido"}
            {goal.is_shared ? " · compartilhada" : ""}
          </p>
        </div>
        <Badge tone={STATUS_BADGE[goal.status]?.tone ?? "neutral"}>{STATUS_BADGE[goal.status]?.label ?? goal.status}</Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-semibold text-text-primary">{formatCurrency(goal.current_amount)}</p>
          <p className="text-xs text-text-secondary">de {formatCurrency(goal.target_amount)}</p>
        </div>
        <ProgressBar value={progress} className="mt-2" />
        <p className="mt-1 text-xs text-text-secondary">{progress.toFixed(0)}% concluído</p>
      </div>

      {goal.status === "active" && suggestedMonthly > 0 ? (
        <p className="mt-3 rounded-[var(--radius-control)] bg-blue-50 px-3 py-2 text-xs text-brand-blue">
          Sugestão: guardar {formatCurrency(suggestedMonthly)}/mês para chegar no prazo.
        </p>
      ) : null}

      {canManage ? (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" className="text-negative" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      ) : null}
    </div>
  );
}
