"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfileAction } from "@/lib/auth-guards";
import { todayISO } from "@/lib/format";
import type { IncomeType } from "@/types/database";

export interface IncomeInput {
  description: string;
  amount: number;
  category_id?: string | null;
  account_id?: string | null;
  income_type: IncomeType;
  expected_date: string;
  is_shared?: boolean;
  notes?: string | null;
}

function revalidateIncomeViews() {
  revalidatePath("/entradas");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

/** Só cria entradas simples (fixed/variable). Entradas recorrentes usam createIncomeRecurrence. */
export async function createIncome(input: IncomeInput) {
  const profile = await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("incomes").insert({
    household_id: profile.household_id,
    user_id: profile.user_id,
    description: input.description,
    amount: input.amount,
    category_id: input.category_id || null,
    account_id: input.account_id || null,
    income_type: input.income_type,
    expected_date: input.expected_date,
    is_shared: input.is_shared ?? false,
    notes: input.notes || null,
    status: "expected",
  });
  if (error) return { error: error.message };
  revalidateIncomeViews();
  return {};
}

export async function updateIncome(id: string, input: IncomeInput) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("incomes")
    .update({
      description: input.description,
      amount: input.amount,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      income_type: input.income_type,
      expected_date: input.expected_date,
      is_shared: input.is_shared ?? false,
      notes: input.notes || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateIncomeViews();
  return {};
}

export async function deleteIncome(id: string) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateIncomeViews();
  return {};
}

export async function markIncomeReceived(id: string) {
  await requireProfileAction();
  const supabase = await createClient();

  const { data: income, error: fetchError } = await supabase
    .from("incomes")
    .select("account_id, amount, status")
    .eq("id", id)
    .single();
  if (fetchError || !income) return { error: "Entrada não encontrada." };
  if (income.status === "received") return {};

  const { error } = await supabase
    .from("incomes")
    .update({ status: "received", received_date: todayISO() })
    .eq("id", id);
  if (error) return { error: error.message };

  if (income.account_id) {
    await supabase.rpc("increment_account_balance", {
      p_account_id: income.account_id,
      p_delta: income.amount,
    });
  }

  revalidateIncomeViews();
  return {};
}
