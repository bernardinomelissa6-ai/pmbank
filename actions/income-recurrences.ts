"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfileAction } from "@/lib/auth-guards";
import { generateOccurrenceDates } from "@/lib/recurrence";
import { addMonths, todayISO } from "@/lib/format";
import type { RecurrenceFrequency } from "@/types/database";

const ROLLING_WINDOW_MONTHS = 24;

export interface IncomeRecurrenceInput {
  description: string;
  amount: number;
  category_id?: string | null;
  account_id?: string | null;
  is_shared?: boolean;
  notes?: string | null;
  frequency: RecurrenceFrequency;
  custom_interval_days?: number | null;
  start_date: string;
  end_date?: string | null;
}

function revalidateIncomeViews() {
  revalidatePath("/entradas");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

function resolveWindowEnd(startDate: string, endDate?: string | null): string {
  if (endDate) return endDate;
  return addMonths(new Date(`${startDate}T00:00:00`), ROLLING_WINDOW_MONTHS).toISOString().slice(0, 10);
}

export async function createIncomeRecurrence(input: IncomeRecurrenceInput) {
  const profile = await requireProfileAction();
  const supabase = await createClient();

  const windowEnd = resolveWindowEnd(input.start_date, input.end_date);
  const customIntervalDays = input.frequency === "custom" ? input.custom_interval_days ?? 30 : null;

  const dates = generateOccurrenceDates({
    startDate: input.start_date,
    windowEndDate: windowEnd,
    frequency: input.frequency,
    customIntervalDays: customIntervalDays ?? undefined,
  });
  if (dates.length === 0) return { error: "Data final precisa ser depois da data inicial." };

  const { data: rule, error: ruleError } = await supabase
    .from("income_recurrences")
    .insert({
      household_id: profile.household_id,
      user_id: profile.user_id,
      description: input.description,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      amount: input.amount,
      frequency: input.frequency,
      custom_interval_days: customIntervalDays,
      start_date: input.start_date,
      end_date: input.end_date || null,
      generated_until: windowEnd,
      notes: input.notes || null,
      is_shared: input.is_shared ?? false,
      status: "active",
    })
    .select("id")
    .single();
  if (ruleError || !rule) return { error: ruleError?.message ?? "Não foi possível criar a recorrência." };

  const { error: incomesError } = await supabase.from("incomes").insert(
    dates.map((expected_date) => ({
      household_id: profile.household_id,
      user_id: profile.user_id,
      description: input.description,
      amount: input.amount,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      income_type: "recurring" as const,
      expected_date,
      status: "expected" as const,
      is_shared: input.is_shared ?? false,
      notes: input.notes || null,
      recurrence_group_id: rule.id,
    }))
  );
  if (incomesError) return { error: incomesError.message };

  revalidateIncomeViews();
  return {};
}

export interface IncomeRecurrenceUpdateInput {
  description: string;
  amount: number;
  category_id?: string | null;
  account_id?: string | null;
  is_shared?: boolean;
  notes?: string | null;
  end_date?: string | null;
}

export async function updateIncomeRecurrence(ruleId: string, input: IncomeRecurrenceUpdateInput) {
  await requireProfileAction();
  const supabase = await createClient();

  const { data: rule, error: fetchError } = await supabase
    .from("income_recurrences")
    .select("*")
    .eq("id", ruleId)
    .single();
  if (fetchError || !rule) return { error: "Recorrência não encontrada." };

  const today = todayISO();
  const newWindowEnd = resolveWindowEnd(rule.start_date, input.end_date);

  const { error: ruleUpdateError } = await supabase
    .from("income_recurrences")
    .update({
      description: input.description,
      amount: input.amount,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      is_shared: input.is_shared ?? false,
      notes: input.notes || null,
      end_date: input.end_date || null,
      generated_until: newWindowEnd,
    })
    .eq("id", ruleId);
  if (ruleUpdateError) return { error: ruleUpdateError.message };

  const { error: cascadeError } = await supabase
    .from("incomes")
    .update({
      description: input.description,
      amount: input.amount,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
      is_shared: input.is_shared ?? false,
      notes: input.notes || null,
    })
    .eq("recurrence_group_id", ruleId)
    .eq("status", "expected")
    .gte("expected_date", today);
  if (cascadeError) return { error: cascadeError.message };

  const { error: pruneError } = await supabase
    .from("incomes")
    .delete()
    .eq("recurrence_group_id", ruleId)
    .eq("status", "expected")
    .gt("expected_date", newWindowEnd);
  if (pruneError) return { error: pruneError.message };

  const { data: lastOccurrence } = await supabase
    .from("incomes")
    .select("expected_date")
    .eq("recurrence_group_id", ruleId)
    .order("expected_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOccurrence) {
    const extraDates = generateOccurrenceDates({
      startDate: rule.start_date,
      windowEndDate: newWindowEnd,
      frequency: rule.frequency,
      customIntervalDays: rule.custom_interval_days ?? undefined,
    }).filter((date) => date > lastOccurrence.expected_date);

    if (extraDates.length > 0) {
      const { error: extraError } = await supabase.from("incomes").insert(
        extraDates.map((expected_date) => ({
          household_id: rule.household_id,
          user_id: rule.user_id,
          description: input.description,
          amount: input.amount,
          category_id: input.category_id || null,
          account_id: input.account_id || null,
          income_type: "recurring" as const,
          expected_date,
          status: "expected" as const,
          is_shared: input.is_shared ?? false,
          notes: input.notes || null,
          recurrence_group_id: ruleId,
        }))
      );
      if (extraError) return { error: extraError.message };
    }
  }

  revalidateIncomeViews();
  return {};
}

export async function cancelIncomeRecurrence(ruleId: string) {
  await requireProfileAction();
  const supabase = await createClient();
  const today = todayISO();

  const { error: statusError } = await supabase
    .from("income_recurrences")
    .update({ status: "cancelled" })
    .eq("id", ruleId);
  if (statusError) return { error: statusError.message };

  const { error: deleteError } = await supabase
    .from("incomes")
    .delete()
    .eq("recurrence_group_id", ruleId)
    .eq("status", "expected")
    .gte("expected_date", today);
  if (deleteError) return { error: deleteError.message };

  revalidateIncomeViews();
  return {};
}
