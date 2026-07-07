import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import { CartoesClient } from "./CartoesClient";

export default async function CartoesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const now = new Date();
  const { startISO, endISO } = monthRange(now.getMonth() + 1, now.getFullYear());

  const [{ data: cards }, { data: accounts }, { data: expenses }] = await Promise.all([
    supabase.from("cards").select("*").order("created_at"),
    supabase.from("accounts").select("id,name").order("name"),
    supabase
      .from("expenses")
      .select("id, description, amount, due_date, card_id, status")
      .not("card_id", "is", null)
      .gte("due_date", startISO)
      .lte("due_date", endISO),
  ]);

  const expensesByCard = new Map<string, { id: string; description: string; amount: number; due_date: string; status: string }[]>();
  for (const expense of expenses ?? []) {
    if (!expense.card_id) continue;
    const list = expensesByCard.get(expense.card_id) ?? [];
    list.push(expense);
    expensesByCard.set(expense.card_id, list);
  }

  return (
    <CartoesClient
      cards={cards ?? []}
      accounts={accounts ?? []}
      isAdmin={profile.role === "admin"}
      expensesByCard={Object.fromEntries(expensesByCard)}
    />
  );
}
