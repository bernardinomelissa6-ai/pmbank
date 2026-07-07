"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfileAction } from "@/lib/auth-guards";
import { todayISO } from "@/lib/format";

function revalidateInstallmentViews() {
  revalidatePath("/parcelamentos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

export async function markInstallmentPaid(id: string) {
  await requireProfileAction();
  const supabase = await createClient();

  const { data: installment, error: fetchError } = await supabase
    .from("installments")
    .select("amount, status, parent_expense_id, expenses:parent_expense_id(account_id)")
    .eq("id", id)
    .single();
  if (fetchError || !installment) return { error: "Parcela não encontrada." };
  if (installment.status === "paid") return {};

  const { error } = await supabase
    .from("installments")
    .update({ status: "paid", paid_date: todayISO() })
    .eq("id", id);
  if (error) return { error: error.message };

  const accountId = (installment.expenses as unknown as { account_id: string | null } | null)?.account_id;
  if (accountId) {
    await supabase.rpc("increment_account_balance", { p_account_id: accountId, p_delta: -installment.amount });
  }

  revalidateInstallmentViews();
  return {};
}
