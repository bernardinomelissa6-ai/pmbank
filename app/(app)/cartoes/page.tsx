import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import { CartoesClient } from "./CartoesClient";

export default async function CartoesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const now = new Date();
  const { startISO, endISO } = monthRange(now.getMonth() + 1, now.getFullYear());

  const [{ data: cards }, { data: accounts }, { data: expenses }, { data: installments }, { data: members }] =
    await Promise.all([
      supabase.from("cards").select("*").order("created_at"),
      supabase.from("accounts").select("id,name").order("name"),
      supabase
        .from("expenses")
        .select("id, description, amount, due_date, card_id, status, user_id")
        .not("card_id", "is", null)
        .neq("expense_type", "installment")
        .gte("due_date", startISO)
        .lte("due_date", endISO),
      supabase
        .from("installments")
        .select("id, amount, due_date, status, user_id, expense:expenses(card_id, description)")
        .gte("due_date", startISO)
        .lte("due_date", endISO),
      supabase.from("profiles").select("user_id, name, status"),
    ]);

  const memberByUserId = new Map((members ?? []).map((m) => [m.user_id, m.name]));

  const expensesByCard = new Map<
    string,
    { id: string; description: string; amount: number; due_date: string; status: string; personId: string; personName: string }[]
  >();

  for (const expense of expenses ?? []) {
    if (!expense.card_id) continue;
    const list = expensesByCard.get(expense.card_id) ?? [];
    list.push({ ...expense, personId: expense.user_id, personName: memberByUserId.get(expense.user_id) ?? "—" });
    expensesByCard.set(expense.card_id, list);
  }

  for (const installment of (installments ?? []) as unknown as {
    id: string;
    amount: number;
    due_date: string;
    status: string;
    user_id: string;
    expense: { card_id: string | null; description: string } | null;
  }[]) {
    const cardId = installment.expense?.card_id;
    if (!cardId) continue;
    const list = expensesByCard.get(cardId) ?? [];
    list.push({
      id: installment.id,
      description: installment.expense?.description ?? "Parcela",
      amount: installment.amount,
      due_date: installment.due_date,
      status: installment.status,
      personId: installment.user_id,
      personName: memberByUserId.get(installment.user_id) ?? "—",
    });
    expensesByCard.set(cardId, list);
  }

  for (const list of expensesByCard.values()) {
    list.sort((a, b) => a.due_date.localeCompare(b.due_date));
  }

  return (
    <CartoesClient
      cards={cards ?? []}
      accounts={accounts ?? []}
      isAdmin={profile.role === "admin"}
      expensesByCard={Object.fromEntries(expensesByCard)}
      personOptions={(members ?? [])
        .filter((m) => m.status === "active")
        .map((m) => ({ value: m.user_id, label: m.name }))}
    />
  );
}
