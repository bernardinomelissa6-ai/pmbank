import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { ContasClient } from "./ContasClient";

export default async function ContasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("accounts").select("*").order("created_at");

  return <ContasClient accounts={accounts ?? []} isAdmin={profile.role === "admin"} />;
}
