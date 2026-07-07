"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, STATUS_BADGE } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChartCard } from "@/components/ui/ChartCard";
import { markInstallmentPaid } from "@/actions/installments";
import { formatCurrency, formatDate, MONTH_NAMES, todayISO } from "@/lib/format";
import type { Installment } from "@/types/database";

interface InstallmentRow extends Installment {
  expense: { description: string; category: { name: string } | null } | null;
  ownerName: string;
}

export function ParcelamentosClient({
  currentUserId,
  installments,
}: {
  currentUserId: string;
  installments: InstallmentRow[];
}) {
  const router = useRouter();
  const today = todayISO();

  const groups = useMemo(() => {
    const map = new Map<string, InstallmentRow[]>();
    for (const installment of installments) {
      const list = map.get(installment.parent_expense_id) ?? [];
      list.push(installment);
      map.set(installment.parent_expense_id, list);
    }
    return Array.from(map.entries())
      .map(([parentId, items]) => {
        const sorted = [...items].sort((a, b) => a.installment_number - b.installment_number);
        const paidCount = sorted.filter((i) => i.status === "paid").length;
        const nextOpen = sorted.find((i) => i.status === "open");
        return {
          parentId,
          description: sorted[0]?.expense?.description ?? "Compra parcelada",
          categoryName: sorted[0]?.expense?.category?.name ?? null,
          ownerName: sorted[0]?.ownerName ?? "—",
          total: sorted.reduce((acc, i) => acc + i.amount, 0),
          items: sorted,
          paidCount,
          totalCount: sorted.length,
          nextOpen,
          canManage: sorted[0]?.user_id === currentUserId,
        };
      })
      .sort((a, b) => (a.nextOpen?.due_date ?? "9999").localeCompare(b.nextOpen?.due_date ?? "9999"));
  }, [installments, currentUserId]);

  const futureProjection = useMemo(() => {
    const map = new Map<string, number>();
    for (const installment of installments) {
      if (installment.status !== "open") continue;
      const key = installment.due_date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + installment.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 6)
      .map(([key, value]) => {
        const [year, month] = key.split("-").map(Number);
        return { label: `${MONTH_NAMES[month - 1]}/${year}`, value };
      });
  }, [installments]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Parcelamentos</h1>
        <p className="text-sm text-text-secondary">Compras parceladas, progresso e projeção de parcelas futuras.</p>
      </div>

      {futureProjection.length > 0 ? (
        <ChartCard title="Projeção das parcelas futuras" subtitle="Total em aberto por mês">
          <div className="flex h-full flex-col justify-center gap-2 overflow-y-auto">
            {futureProjection.map((point) => (
              <div key={point.label} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{point.label}</span>
                <span className="font-medium text-text-primary">{formatCurrency(point.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState title="Nenhum parcelamento" description="Crie um gasto do tipo parcelado em /gastos." />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.parentId} className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">{group.description}</p>
                  <p className="text-xs text-text-secondary">
                    {group.categoryName ?? "Sem categoria"} · {group.ownerName}
                  </p>
                </div>
                <p className="font-semibold text-text-primary">{formatCurrency(group.total)}</p>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>
                    {group.paidCount}/{group.totalCount} parcelas pagas
                  </span>
                  {group.nextOpen ? <span>Próxima: {formatDate(group.nextOpen.due_date)}</span> : <span>Quitado</span>}
                </div>
                <ProgressBar value={(group.paidCount / group.totalCount) * 100} className="mt-1" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((installment) => {
                  const isLate = installment.status === "open" && installment.due_date < today;
                  const statusKey = isLate ? "late" : installment.status;
                  return (
                    <div key={installment.id} className="rounded-[var(--radius-control)] border border-border-subtle p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary">
                          {installment.installment_number}/{installment.total_installments}
                        </span>
                        <Badge tone={STATUS_BADGE[statusKey]?.tone ?? "neutral"}>
                          {STATUS_BADGE[statusKey]?.label ?? statusKey}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-text-primary">{formatCurrency(installment.amount)}</p>
                      <p className="text-xs text-text-secondary">{formatDate(installment.due_date)}</p>
                      {installment.status === "open" && group.canManage ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2 w-full"
                          onClick={async () => {
                            await markInstallmentPaid(installment.id);
                            router.refresh();
                          }}
                        >
                          Marcar paga
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
