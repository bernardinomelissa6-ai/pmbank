import { requireAdmin } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: members } = await supabase.from("profiles").select("*").order("created_at");

  return <UsuariosClient currentProfileId={profile.id} members={members ?? []} />;
}
