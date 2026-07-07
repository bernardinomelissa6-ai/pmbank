"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfileAction } from "@/lib/auth-guards";
import type { GoalStatus } from "@/types/database";

export interface GoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  is_shared?: boolean;
}

function revalidateGoalViews() {
  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

export async function createGoal(input: GoalInput) {
  const profile = await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("financial_goals").insert({
    household_id: profile.household_id,
    user_id: profile.user_id,
    name: input.name,
    target_amount: input.target_amount,
    current_amount: input.current_amount ?? 0,
    deadline: input.deadline || null,
    is_shared: input.is_shared ?? false,
    status: "active",
  });
  if (error) return { error: error.message };
  revalidateGoalViews();
  return {};
}

export async function updateGoal(id: string, input: GoalInput) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("financial_goals")
    .update({
      name: input.name,
      target_amount: input.target_amount,
      current_amount: input.current_amount ?? 0,
      deadline: input.deadline || null,
      is_shared: input.is_shared ?? false,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateGoalViews();
  return {};
}

export async function updateGoalStatus(id: string, status: GoalStatus) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("financial_goals").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidateGoalViews();
  return {};
}

export async function deleteGoal(id: string) {
  await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("financial_goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateGoalViews();
  return {};
}
