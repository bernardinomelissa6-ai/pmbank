import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { GastosClient } from "./GastosClient";

export default async function GastosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: expenses }, { data: categories }, { data: accounts }, { data: cards }, { data: members }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("*, category:categories(id,name,color), account:accounts(id,name), card:cards(id,name)")
        .order("due_date", { ascending: false }),
      supabase.from("categories").select("id,name").eq("type", "expense").order("name"),
      supabase.from("accounts").select("id,name").order("name"),
      supabase.from("cards").select("id,name").order("name"),
      supabase.from("profiles").select("id,user_id,name"),
    ]);

  const memberByUserId = new Map((members ?? []).map((member) => [member.user_id, member]));

  return (
    <GastosClient
      currentUserId={profile.user_id}
      expenses={(expenses ?? []).map((expense) => ({
        ...expense,
        ownerName: memberByUserId.get(expense.user_id)?.name ?? "—",
      }))}
      categories={categories ?? []}
      accounts={accounts ?? []}
      cards={cards ?? []}
      members={(members ?? []).map((m) => ({ id: m.user_id, name: m.name }))}
    />
  );
}
