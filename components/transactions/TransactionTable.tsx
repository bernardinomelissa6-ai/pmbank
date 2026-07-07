"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, STATUS_BADGE } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface TransactionRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  statusKey: string;
  categoryName: string | null;
  categoryColor: string | null;
  personName: string;
  personId: string;
  isShared: boolean;
  extra?: string | null;
  canManage: boolean;
  recurrenceGroupId?: string | null;
}

interface FilterOption {
  value: string;
  label: string;
}

export function TransactionTable({
  rows,
  categoryOptions,
  personOptions,
  markLabel,
  pendingStatusKey,
  onMarkDone,
  onEdit,
  onDelete,
  onCancelRecurrence,
}: {
  rows: TransactionRow[];
  categoryOptions: FilterOption[];
  personOptions: FilterOption[];
  markLabel: string;
  pendingStatusKey: string;
  onMarkDone: (id: string) => Promise<void> | void;
  onEdit: (row: TransactionRow) => void;
  onDelete: (id: string) => Promise<void> | void;
  onCancelRecurrence?: (recurrenceGroupId: string) => Promise<void> | void;
}) {
  const [status, setStatus] = useState("all");
  const [person, setPerson] = useState("all");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingCancelRecurrenceId, setPendingCancelRecurrenceId] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.date.slice(0, 7)));
    return Array.from(set)
      .sort()
      .reverse()
      .map((value) => ({ value, label: formatMonthLabel(value) }));
  }, [rows]);

  const filteredRows = rows.filter((row) => {
    if (status !== "all" && row.statusKey !== status) return false;
    if (person !== "all" && row.personId !== person) return false;
    if (category !== "all" && row.categoryName !== category) return false;
    if (month !== "all" && row.date.slice(0, 7) !== month) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_BADGE).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Pessoa">
          <option value="all">Todas as pessoas</option>
          {personOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mês">
          <option value="all">Todos os meses</option>
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState title="Nada por aqui ainda" description="Ajuste os filtros ou crie um novo lançamento." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface sm:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{row.description}</div>
                      {row.extra ? <div className="text-xs text-text-secondary">{row.extra}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{row.categoryName ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {row.personName}
                      {row.isShared ? <Badge tone="brand">compartilhado</Badge> : null}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(row.date)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_BADGE[row.statusKey]?.tone ?? "neutral"}>
                        {STATUS_BADGE[row.statusKey]?.label ?? row.statusKey}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        row={row}
                        markLabel={markLabel}
                        pendingStatusKey={pendingStatusKey}
                        onMarkDone={onMarkDone}
                        onEdit={onEdit}
                        onDeleteRequest={() => setPendingDeleteId(row.id)}
                        onCancelRecurrenceRequest={
                          onCancelRecurrence ? () => setPendingCancelRecurrenceId(row.recurrenceGroupId ?? null) : undefined
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:hidden">
            {filteredRows.map((row) => (
              <div key={row.id} className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary">{row.description}</p>
                    <p className="text-xs text-text-secondary">
                      {row.categoryName ?? "—"} · {row.personName}
                    </p>
                  </div>
                  <p className="font-semibold text-text-primary">{formatCurrency(row.amount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_BADGE[row.statusKey]?.tone ?? "neutral"}>
                      {STATUS_BADGE[row.statusKey]?.label ?? row.statusKey}
                    </Badge>
                    <span className="text-xs text-text-secondary">{formatDate(row.date)}</span>
                  </div>
                  <RowActions
                    row={row}
                    markLabel={markLabel}
                    pendingStatusKey={pendingStatusKey}
                    onMarkDone={onMarkDone}
                    onEdit={onEdit}
                    onDeleteRequest={() => setPendingDeleteId(row.id)}
                    onCancelRecurrenceRequest={
                      onCancelRecurrence ? () => setPendingCancelRecurrenceId(row.recurrenceGroupId ?? null) : undefined
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir lançamento"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (pendingDeleteId) await onDelete(pendingDeleteId);
        }}
      />

      <ConfirmDialog
        open={pendingCancelRecurrenceId !== null}
        title="Cancelar recorrência"
        description="As ocorrências futuras ainda não recebidas serão removidas. O histórico já recebido é mantido."
        confirmLabel="Cancelar recorrência"
        danger
        onClose={() => setPendingCancelRecurrenceId(null)}
        onConfirm={async () => {
          if (pendingCancelRecurrenceId && onCancelRecurrence) await onCancelRecurrence(pendingCancelRecurrenceId);
        }}
      />
    </div>
  );
}

function RowActions({
  row,
  markLabel,
  pendingStatusKey,
  onMarkDone,
  onEdit,
  onDeleteRequest,
  onCancelRecurrenceRequest,
}: {
  row: TransactionRow;
  markLabel: string;
  pendingStatusKey: string;
  onMarkDone: (id: string) => Promise<void> | void;
  onEdit: (row: TransactionRow) => void;
  onDeleteRequest: () => void;
  onCancelRecurrenceRequest?: () => void;
}) {
  if (!row.canManage) return <span className="text-xs text-text-secondary">—</span>;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {row.statusKey === pendingStatusKey ? (
        <Button size="sm" variant="secondary" onClick={() => onMarkDone(row.id)}>
          {markLabel}
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => onEdit(row)}>
        Editar
      </Button>
      {row.recurrenceGroupId && onCancelRecurrenceRequest ? (
        <Button size="sm" variant="ghost" onClick={onCancelRecurrenceRequest} className="text-negative">
          Cancelar série
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={onDeleteRequest} className="text-negative">
        Excluir
      </Button>
    </div>
  );
}

function formatMonthLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}
