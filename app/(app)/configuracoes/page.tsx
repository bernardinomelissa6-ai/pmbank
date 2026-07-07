import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { ConfiguracoesClient } from "./ConfiguracoesClient";

export default async function ConfiguracoesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: household }, { data: categories }] = await Promise.all([
    supabase.from("households").select("*").eq("id", profile.household_id).maybeSingle(),
    supabase.from("categories").select("*").order("type").order("name"),
  ]);

  return (
    <ConfiguracoesClient
      profile={profile}
      household={household ?? { id: profile.household_id, name: "Minha família" }}
      categories={categories ?? []}
    />
  );
}
