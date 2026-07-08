import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (profile as Profile) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status === "inactive") redirect("/login?inactive=1");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

/** Para uso dentro de Server Actions — lança erro em vez de redirecionar. */
export async function requireAdminAction(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Não autenticado.");
  if (profile.status === "inactive") throw new Error("Usuário inativo.");
  if (profile.role !== "admin") throw new Error("Ação restrita ao administrador.");
  return profile;
}

export async function requireProfileAction(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Não autenticado.");
  if (profile.status === "inactive") throw new Error("Usuário inativo.");
  return profile;
}
