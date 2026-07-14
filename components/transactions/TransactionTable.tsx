"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate, MONTH_NAMES } from "@/lib/format";
import { Badge, STATUS_BADGE } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

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

const PAGE_SIZE = 25;

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

  const monthKeys = useMemo(() => {
    const set = new Set(rows.map((row) => row.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = rows.filter((row) => {
    if (status !== "all" && row.statusKey !== status) return false;
    if (person !== "all" && row.personId !== person) return false;
    if (category !== "all" && row.categoryName !== category) return false;
    if (month !== "all" && row.date.slice(0, 7) !== month) return false;
    return true;
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status, person, category, month]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Dropdown
          value={status}
          onChange={setStatus}
          ariaLabel="Status"
          options={[
            { value: "all", label: "Todos os status" },
            ...Object.entries(STATUS_BADGE).map(([key, { label }]) => ({ value: key, label })),
          ]}
        />
        <Dropdown
          value={person}
          onChange={setPerson}
          ariaLabel="Pessoa"
          options={[{ value: "all", label: "Todas as pessoas" }, ...personOptions]}
        />
        <Dropdown
          value={category}
          onChange={setCategory}
          ariaLabel="Categoria"
          options={[{ value: "all", label: "Todas as categorias" }, ...categoryOptions]}
        />
        <MonthStepper value={month} onChange={setMonth} months={monthKeys} />
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState title="Nada por aqui ainda" description="Ajuste os filtros ou crie um novo lançamento." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface sm:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
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
                {visibleRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-hover">
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
            {visibleRows.map((row) => (
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

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-1 pt-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Página anterior"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-medium text-text-secondary">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Próxima página"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
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

function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function monthLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function MonthStepper({
  value,
  months,
  onChange,
}: {
  value: string;
  months: string[];
  onChange: (value: string) => void;
}) {
  const activeKey = value !== "all" ? value : months[months.length - 1];
  const index = activeKey ? months.indexOf(activeKey) : -1;
  const canGoPrev = index > 0;
  const canGoNext = index !== -1 && index < months.length - 1;

  return (
    <div className="flex h-11 items-center gap-1 rounded-full border border-border-subtle bg-surface p-1">
      <button
        type="button"
        onClick={() => canGoPrev && onChange(months[index - 1])}
        disabled={!canGoPrev}
        aria-label="Mês anterior"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <IconChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 truncate px-1 text-center text-xs font-medium text-text-primary">
        {value === "all" ? "Todos os meses" : monthLabel(value)}
      </span>
      <button
        type="button"
        onClick={() => canGoNext && onChange(months[index + 1])}
        disabled={!canGoNext}
        aria-label="Próximo mês"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          value === "all" ? "bg-brand-blue text-white" : "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20"
        )}
      >
        Todos
      </button>
    </div>
  );
}
