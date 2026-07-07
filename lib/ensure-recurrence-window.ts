import "server-only";
import { createClient } from "@/lib/supabase/server";
import { generateOccurrenceDates } from "@/lib/recurrence";
import { addMonths } from "@/lib/format";

const ROLLING_WINDOW_MONTHS = 24;
const RENEW_THRESHOLD_MONTHS = 18;

/**
 * Renova a janela de geração das recorrências "sem data final" do usuário logado quando ela
 * está acabando (< 18 meses restantes) — mantendo sempre ~24 meses de ocorrências futuras
 * geradas, sem o usuário precisar fazer nada. Só toca nas regras do próprio usuário (RLS),
 * chamada a cada carregamento de página autenticada.
 */
export async function ensureRecurrenceWindow(userId: string): Promise<void> {
  const supabase = await createClient();
  const thresholdDate = addMonths(new Date(), RENEW_THRESHOLD_MONTHS).toISOString().slice(0, 10);

  const { data: rulesToRenew } = await supabase
    .from("income_recurrences")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("end_date", null)
    .lt("generated_until", thresholdDate);

  if (!rulesToRenew || rulesToRenew.length === 0) return;

  const newWindowEnd = addMonths(new Date(), ROLLING_WINDOW_MONTHS).toISOString().slice(0, 10);

  for (const rule of rulesToRenew) {
    const extraDates = generateOccurrenceDates({
      startDate: rule.start_date,
      windowEndDate: newWindowEnd,
      frequency: rule.frequency,
      customIntervalDays: rule.custom_interval_days ?? undefined,
    }).filter((date) => date > rule.generated_until);

    if (extraDates.length > 0) {
      await supabase.from("incomes").insert(
        extraDates.map((expected_date) => ({
          household_id: rule.household_id,
          user_id: rule.user_id,
          description: rule.description,
          amount: rule.amount,
          category_id: rule.category_id,
          account_id: rule.account_id,
          income_type: "recurring" as const,
          expected_date,
          status: "expected" as const,
          is_shared: rule.is_shared,
          notes: rule.notes,
          recurrence_group_id: rule.id,
        }))
      );
    }

    await supabase.from("income_recurrences").update({ generated_until: newWindowEnd }).eq("id", rule.id);
  }
}
