"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAction } from "@/lib/auth-guards";
import type { AccountType } from "@/types/database";

export interface AccountInput {
  name: string;
  type: AccountType;
  initial_balance: number;
}

export async function createAccount(input: AccountInput) {
  const profile = await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    household_id: profile.household_id,
    name: input.name,
    type: input.type,
    initial_balance: input.initial_balance,
    current_balance: input.initial_balance,
    created_by: profile.user_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/contas");
  return {};
}

export async function updateAccount(id: string, input: Partial<AccountInput>) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contas");
  return {};
}

export async function deleteAccount(id: string) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contas");
  return {};
}
