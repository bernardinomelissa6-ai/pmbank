"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TransactionTable, type TransactionRow } from "@/components/transactions/TransactionTable";
import { IncomeForm, type IncomeFormInitialValues } from "@/components/transactions/IncomeForm";
import { RecurrenceEditForm } from "@/components/transactions/RecurrenceEditForm";
import { PersonSummaryTable } from "@/components/transactions/PersonSummaryTable";
import { deleteIncome, markIncomeReceived } from "@/actions/incomes";
import { cancelIncomeRecurrence } from "@/actions/income-recurrences";
import { todayISO } from "@/lib/format";
import type { Category, Income, IncomeRecurrence } from "@/types/database";

interface IncomeRow extends Income {
  category: Pick<Category, "id" | "name" | "color"> | null;
  account: { id: string; name: string } | null;
  ownerName: string;
}

export function EntradasClient({
  currentUserId,
  incomes,
  categories,
  accounts,
  members,
  recurrences,
}: {
  currentUserId: string;
  incomes: IncomeRow[];
  categories: Pick<Category, "id" | "name">[];
  accounts: { id: string; name: string }[];
  members: { id: string; name: string }[];
  recurrences: IncomeRecurrence[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeFormInitialValues | undefined>(undefined);
  const [editingRule, setEditingRule] = useState<IncomeRecurrence | null>(null);
  const [formKey, setFormKey] = useState(0);

  const recurrenceById = new Map(recurrences.map((rule) => [rule.id, rule]));

  const rows: TransactionRow[] = incomes.map((income) => ({
    id: income.id,
    description: income.description,
    amount: income.amount,
    date: income.expected_date,
    statusKey: income.status,
    categoryName: income.category?.name ?? null,
    categoryColor: income.category?.color ?? null,
    personName: income.ownerName,
    personId: income.user_id,
    isShared: income.is_shared,
    extra: income.account?.name ?? null,
    canManage: income.user_id === currentUserId,
    recurrenceGroupId: income.recurrence_group_id,
  }));

  const currentMonthKey = todayISO().slice(0, 7);
  const totalsByPerson = new Map<string, number>();
  for (const income of incomes) {
    if (income.expected_date.slice(0, 7) !== currentMonthKey) continue;
    totalsByPerson.set(income.user_id, (totalsByPerson.get(income.user_id) ?? 0) + income.amount);
  }
  const personSummaryRows = members
    .filter((member) => totalsByPerson.has(member.id))
    .map((member) => ({ personId: member.id, personName: member.name, total: totalsByPerson.get(member.id) ?? 0 }));

  function openCreate() {
    setEditing(undefined);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(row: TransactionRow) {
    const income = incomes.find((i) => i.id === row.id);
    if (!income) return;

    if (income.recurrence_group_id) {
      const rule = recurrenceById.get(income.recurrence_group_id);
      if (rule) {
        setEditingRule(rule);
        return;
      }
    }

    setEditing({
      id: income.id,
      description: income.description,
      amount: income.amount,
      category_id: income.category_id,
      account_id: income.account_id,
      income_type: income.income_type,
      expected_date: income.expected_date,
      is_shared: income.is_shared,
      notes: income.notes,
    });
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Entradas</h1>
          <p className="text-sm text-text-secondary">Salários, extras e outras receitas da família.</p>
        </div>
        <Button onClick={openCreate}>Nova entrada</Button>
      </div>

      {personSummaryRows.length > 0 ? (
        <PersonSummaryTable
          title="Receita por pessoa"
          subtitle="Mês atual — todos os lançamentos, de todo mundo, aparecem aqui"
          rows={personSummaryRows}
        />
      ) : null}

      <TransactionTable
        rows={rows}
        categoryOptions={categories.map((c) => ({ value: c.name, label: c.name }))}
        personOptions={members.map((m) => ({ value: m.id, label: m.name }))}
        markLabel="Marcar recebida"
        pendingStatusKey="expected"
        onMarkDone={async (id) => {
          await markIncomeReceived(id);
          router.refresh();
        }}
        onEdit={openEdit}
        onDelete={async (id) => {
          await deleteIncome(id);
          router.refresh();
        }}
        onCancelRecurrence={async (recurrenceGroupId) => {
          await cancelIncomeRecurrence(recurrenceGroupId);
          router.refresh();
        }}
      />

      <IncomeForm
        key={formKey}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        accounts={accounts}
        initialValues={editing}
      />

      {editingRule ? (
        <RecurrenceEditForm
          key={editingRule.id}
          open={editingRule !== null}
          onClose={() => setEditingRule(null)}
          categories={categories}
          accounts={accounts}
          rule={editingRule}
        />
      ) : null}
    </div>
  );
}
