"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAction } from "@/lib/auth-guards";

export interface CardInput {
  name: string;
  account_id?: string | null;
  limit_amount?: number | null;
  closing_day?: number | null;
  due_day?: number | null;
}

export async function createCard(input: CardInput) {
  const profile = await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("cards").insert({
    household_id: profile.household_id,
    name: input.name,
    account_id: input.account_id ?? null,
    limit_amount: input.limit_amount ?? null,
    closing_day: input.closing_day ?? null,
    due_day: input.due_day ?? null,
    created_by: profile.user_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/cartoes");
  return {};
}

export async function updateCard(id: string, input: Partial<CardInput>) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("cards").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cartoes");
  return {};
}

export async function deleteCard(id: string) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cartoes");
  return {};
}
