"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TransactionTable, type TransactionRow } from "@/components/transactions/TransactionTable";
import { ExpenseForm, type ExpenseFormInitialValues } from "@/components/transactions/ExpenseForm";
import { deleteExpense, markExpensePaid } from "@/actions/expenses";
import type { Category, Expense } from "@/types/database";

const EXPENSE_TYPE_LABEL: Record<string, string> = {
  fixed: "Fixo",
  variable: "Variável",
  recurring: "Recorrente",
  installment: "Parcelado",
};

interface ExpenseRow extends Expense {
  category: Pick<Category, "id" | "name" | "color"> | null;
  account: { id: string; name: string } | null;
  card: { id: string; name: string } | null;
  ownerName: string;
}

export function GastosClient({
  currentUserId,
  expenses,
  categories,
  accounts,
  cards,
  members,
}: {
  currentUserId: string;
  expenses: ExpenseRow[];
  categories: Pick<Category, "id" | "name">[];
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseFormInitialValues | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  const rows: TransactionRow[] = expenses.map((expense) => {
    const extraParts = [expense.card?.name, EXPENSE_TYPE_LABEL[expense.expense_type]].filter(Boolean);
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.due_date,
      statusKey: expense.status,
      categoryName: expense.category?.name ?? null,
      categoryColor: expense.category?.color ?? null,
      personName: expense.ownerName,
      personId: expense.user_id,
      isShared: expense.is_shared,
      extra: extraParts.length ? extraParts.join(" · ") : null,
      canManage: expense.user_id === currentUserId,
    };
  });

  function openCreate() {
    setEditing(undefined);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(row: TransactionRow) {
    const expense = expenses.find((e) => e.id === row.id);
    if (!expense) return;
    setEditing({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category_id: expense.category_id,
      account_id: expense.account_id,
      card_id: expense.card_id,
      expense_type: expense.expense_type,
      due_date: expense.due_date,
      payment_method: expense.payment_method,
      is_shared: expense.is_shared,
    });
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Gastos</h1>
          <p className="text-sm text-text-secondary">Contas, compras e parcelamentos da família.</p>
        </div>
        <Button onClick={openCreate}>Novo gasto</Button>
      </div>

      <TransactionTable
        rows={rows}
        categoryOptions={categories.map((c) => ({ value: c.name, label: c.name }))}
        personOptions={members.map((m) => ({ value: m.id, label: m.name }))}
        markLabel="Marcar pago"
        pendingStatusKey="open"
        onMarkDone={async (id) => {
          await markExpensePaid(id);
          router.refresh();
        }}
        onEdit={openEdit}
        onDelete={async (id) => {
          await deleteExpense(id);
          router.refresh();
        }}
      />

      <ExpenseForm
        key={formKey}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        accounts={accounts}
        cards={cards}
        initialValues={editing}
      />
    </div>
  );
}
