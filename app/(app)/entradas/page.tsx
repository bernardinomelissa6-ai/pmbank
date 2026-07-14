import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { EntradasClient } from "./EntradasClient";

export default async function EntradasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: incomes }, { data: categories }, { data: accounts }, { data: members }, { data: recurrences }] =
    await Promise.all([
      supabase
        .from("incomes")
        .select("*, category:categories(id,name,color), account:accounts(id,name)")
        .order("expected_date", { ascending: false }),
      supabase.from("categories").select("id,name").eq("type", "income").order("name"),
      supabase.from("accounts").select("id,name").order("name"),
      supabase.from("profiles").select("id,user_id,name,status"),
      supabase.from("income_recurrences").select("*").eq("status", "active"),
    ]);

  const memberByUserId = new Map((members ?? []).map((member) => [member.user_id, member]));

  return (
    <EntradasClient
      currentUserId={profile.user_id}
      incomes={(incomes ?? []).map((income) => ({
        ...income,
        ownerName: memberByUserId.get(income.user_id)?.name ?? "—",
      }))}
      categories={categories ?? []}
      accounts={accounts ?? []}
      members={(members ?? [])
        .filter((m) => m.status === "active")
        .map((m) => ({ id: m.user_id, name: m.name }))}
      recurrences={recurrences ?? []}
    />
  );
}
