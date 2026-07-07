import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { ParcelamentosClient } from "./ParcelamentosClient";

export default async function ParcelamentosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: installments }, { data: members }] = await Promise.all([
    supabase
      .from("installments")
      .select("*, expense:expenses(description, category:categories(name))")
      .order("due_date"),
    supabase.from("profiles").select("user_id, name"),
  ]);

  const memberByUserId = new Map((members ?? []).map((m) => [m.user_id, m.name]));

  return (
    <ParcelamentosClient
      currentUserId={profile.user_id}
      installments={(installments ?? []).map((installment) => ({
        ...installment,
        ownerName: memberByUserId.get(installment.user_id) ?? "—",
      }))}
    />
  );
}
