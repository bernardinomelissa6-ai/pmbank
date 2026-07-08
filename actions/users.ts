"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAction } from "@/lib/auth-guards";
import type { ProfileStatus, Role } from "@/types/database";

export async function createHouseholdUser(input: { name: string; email: string; password: string }) {
  const profile = await requireAdminAction();
  if (input.password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." };

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (userError || !userData.user) {
    return { error: userError?.message ?? "Não foi possível criar o usuário." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userData.user.id,
    household_id: profile.household_id,
    name: input.name,
    email: input.email,
    role: "member",
    status: "active",
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userData.user.id);
    return { error: "Não foi possível criar o perfil do usuário." };
  }

  revalidatePath("/usuarios");
  return {};
}

export async function updateUserRole(profileId: string, role: Role) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/usuarios");
  return {};
}

export async function updateUserStatus(profileId: string, status: ProfileStatus) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/usuarios");
  return {};
}
