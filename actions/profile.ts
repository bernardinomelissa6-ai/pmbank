"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfileAction } from "@/lib/auth-guards";

export async function updateOwnName(name: string) {
  const profile = await requireProfileAction();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

export async function updateHouseholdName(name: string) {
  const profile = await requireProfileAction();
  if (profile.role !== "admin") return { error: "Apenas o administrador pode renomear a família." };
  const supabase = await createClient();
  const { error } = await supabase.from("households").update({ name }).eq("id", profile.household_id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}
