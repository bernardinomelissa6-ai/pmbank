"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAction } from "@/lib/auth-guards";
import type { CategoryType } from "@/types/database";

export interface CategoryInput {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

export async function createCategory(input: CategoryInput) {
  const profile = await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    household_id: profile.household_id,
    name: input.name,
    type: input.type,
    color: input.color ?? null,
    icon: input.icon ?? null,
    created_by: profile.user_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

export async function updateCategory(id: string, input: CategoryInput) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: input.name, type: input.type, color: input.color ?? null, icon: input.icon ?? null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

export async function deleteCategory(id: string) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}
