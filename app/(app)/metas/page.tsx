import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { MetasClient } from "./MetasClient";

export default async function MetasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: goals } = await supabase.from("financial_goals").select("*").order("deadline", { nullsFirst: false });

  return <MetasClient currentUserId={profile.user_id} goals={goals ?? []} />;
}
