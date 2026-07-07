"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfileAction } from "@/lib/auth-guards";
import { todayISO } from "@/lib/format";
import { generateInstallments } from "@/lib/installments";
import { generateRecurringDates } from "@/lib/recurrence";
import type { ExpenseType, PaymentMethod } from "@/types/database";

export interface ExpenseInput {
  description: string;
  amount: number;
  category_id?: string | null;
  account_id?: string | null;
  card_id?: string | null;
  expense_type: ExpenseType;
  due_date: string;
  payment_method?: PaymentMethod | null;
  is_shared?: boolean;
  total_installments?: number;
  recurrence_end_date?: string | null;
}

function revalidateExpenseViews() {
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  revalidatePath("/parcelamentos");
  revalidatePath("/cartoes");
}

export async function createExpense(input: ExpenseInput) {
  const profile = await requireProfileAction();
  const supabase = await createClient();

  if (input.expense_type === "recurring") {
    if (!input.recurrence_end_date) return { error: "Informe a data final da recorrência." };
    const dates = generateRecurringDates(input.due_date, input.recurrence_end_date);
    if (dates.length === 0) return { error: "Data final precisa ser depois do vencimento inicial." };

    const groupId = randomUUID();
    const { error: recurringError } = await supabase.from("expenses").insert(
      dates.map((due_date) => ({
        household_id: profile.household_id,
        user_id: profile.user_id,
        description: input.description,
        amount: input.amount,
        category_id: input.category_id || null,
        account_id: input.account_id || null,
        card_id: input.card_id || null,
        expense_type: input.expense_type,
        due_date,
        payment_method: input.payment_method || null,
        is_shared: input.is_shared ?? false,
        status: "open",
        recurrence_group_id: groupId,
        recurrence_end_date: input.recurrence_end_date,
      }))
    );
    if (recurringError) return { error: recurringError.message };

    revalidateExpenseViews();
    return {};
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      household_id: profile.household_id,
      user_id: profile.user_id,
      description: input.description,
      amount: input.amount,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      card_id: input.card_id || null,
      expense_type: input.expense_type,
      due_date: input.due_date,
      payment_method: input.payment_method || null,
      is_shared: input.is_shared ?? false,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !expense) return { error: error?.message ?? "Não foi possível criar o gasto." };

  if (input.expense_type === "installment") {
    const totalInstallments = Math.max(2, input.total_installments ?? 2);
    const installments = generateInstallments(input.amount, totalInstallments, input.due_date);
    const { error: installmentsError } = await supabase.from("installments").insert(
      installments.map((installment) => ({
        household_id: profile.household_id,
        parent_expense_id: expense.id,
        user_id: profile.user_id,
        installment_number: installment.installment_number,
        total_installments: installment.total_installments,
        amount: installment.amount,
        due_date: installment.due_date,
        status: "open",
      }))
    );
    if (installmentsError) return { error: installmentsError.message };
  } else if (input.card_id) {
    await supabase.rpc("increment_card_invoice", { p_card_id: input.card_id, p_delta: input.amount });
  }

  revalidateExpenseViews();
  return {};
}

export async function updateExpense(id: string, input: ExpenseInput) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      description: input.description,
      amount: input.amount,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      card_id: input.card_id || null,
      expense_type: input.expense_type,
      due_date: input.due_date,
      payment_method: input.payment_method || null,
      is_shared: input.is_shared ?? false,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateExpenseViews();
  return {};
}

export async function deleteExpense(id: string) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateExpenseViews();
  return {};
}

export async function markExpensePaid(id: string) {
  await requireProfileAction();
  const supabase = await createClient();

  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("account_id, amount, status")
    .eq("id", id)
    .single();
  if (fetchError || !expense) return { error: "Gasto não encontrado." };
  if (expense.status === "paid") return {};

  const { error } = await supabase
    .from("expenses")
    .update({ status: "paid", paid_date: todayISO() })
    .eq("id", id);
  if (error) return { error: error.message };

  if (expense.account_id) {
    await supabase.rpc("increment_account_balance", {
      p_account_id: expense.account_id,
      p_delta: -expense.amount,
    });
  }

  revalidateExpenseViews();
  return {};
}
