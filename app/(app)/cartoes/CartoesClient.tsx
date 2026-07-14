"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge, STATUS_BADGE } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Dropdown } from "@/components/ui/Dropdown";
import { CardForm, type CardFormInitialValues } from "@/components/cards/CardForm";
import { deleteCard } from "@/actions/cards";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Card } from "@/types/database";

interface LinkedExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  personId: string;
  personName: string;
}

export function CartoesClient({
  cards,
  accounts,
  isAdmin,
  expensesByCard,
  personOptions,
}: {
  cards: Card[];
  accounts: { id: string; name: string }[];
  isAdmin: boolean;
  expensesByCard: Record<string, LinkedExpense[]>;
  personOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CardFormInitialValues | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [person, setPerson] = useState("all");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Cartões</h1>
          <p className="text-sm text-text-secondary">Limite, fatura atual e gastos vinculados do mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            value={person}
            onChange={setPerson}
            ariaLabel="Pessoa"
            options={[{ value: "all", label: "Todas as pessoas" }, ...personOptions]}
          />
          {isAdmin ? (
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormKey((k) => k + 1);
                setFormOpen(true);
              }}
            >
              Novo cartão
            </Button>
          ) : null}
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState title="Nenhum cartão cadastrado" description="Peça para o administrador criar o primeiro cartão." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cards.map((card) => {
            const allLinked = expensesByCard[card.id] ?? [];
            const linked = person === "all" ? allLinked : allLinked.filter((expense) => expense.personId === person);
            const currentInvoice = allLinked.reduce((sum, expense) => sum + expense.amount, 0);
            const usage = card.limit_amount ? (currentInvoice / card.limit_amount) * 100 : 0;
            const availableLimit = card.limit_amount ? card.limit_amount - currentInvoice : null;
            return (
              <div key={card.id} className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{card.name}</p>
                    <p className="text-xs text-text-secondary">
                      Fecha dia {card.closing_day ?? "—"} · vence dia {card.due_day ?? "—"}
                    </p>
                  </div>
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing({
                            id: card.id,
                            name: card.name,
                            account_id: card.account_id,
                            limit_amount: card.limit_amount,
                            closing_day: card.closing_day,
                            due_day: card.due_day,
                          });
                          setFormKey((k) => k + 1);
                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-negative" onClick={() => setPendingDeleteId(card.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-semibold text-text-primary">{formatCurrency(currentInvoice)}</p>
                    {card.limit_amount ? (
                      <p className="text-xs text-text-secondary">de {formatCurrency(card.limit_amount)}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-text-secondary">Fatura atual</p>
                  {card.limit_amount ? <ProgressBar value={usage} className="mt-2" /> : null}
                  {availableLimit !== null ? (
                    <p className="mt-2 text-xs text-text-secondary">
                      Limite disponível: <span className="font-medium text-text-primary">{formatCurrency(availableLimit)}</span>
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-border-subtle pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Gastos vinculados este mês
                  </p>
                  {linked.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      {person === "all" ? "Nenhum gasto neste mês." : "Nenhum gasto dessa pessoa neste mês."}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {linked.map((expense) => (
                        <li key={expense.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-text-primary">{expense.description}</p>
                            <p className="text-xs text-text-secondary">
                              {formatDate(expense.due_date)} · {expense.personName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={STATUS_BADGE[expense.status]?.tone ?? "neutral"}>
                              {STATUS_BADGE[expense.status]?.label ?? expense.status}
                            </Badge>
                            <span className="font-medium text-text-primary">{formatCurrency(expense.amount)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CardForm key={formKey} open={formOpen} onClose={() => setFormOpen(false)} accounts={accounts} initialValues={editing} />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir cartão"
        description="Os gastos vinculados perderão a referência a este cartão."
        confirmLabel="Excluir"
        danger
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (pendingDeleteId) {
            await deleteCard(pendingDeleteId);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
