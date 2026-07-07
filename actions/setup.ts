"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateFirstAdminInput {
  householdName: string;
  name: string;
  email: string;
  password: string;
}

export async function createFirstAdmin(
  input: CreateFirstAdminInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: hasAdmin, error: checkError } = await supabase.rpc("system_has_admin");
  if (checkError) return { error: "Não foi possível verificar o estado do sistema." };
  if (hasAdmin) return { error: "Já existe um administrador. Peça para ele te cadastrar em /usuarios." };

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (userError || !userData.user) {
    return { error: userError?.message ?? "Não foi possível criar o usuário." };
  }
  const userId = userData.user.id;

  const { data: household, error: householdError } = await admin
    .from("households")
    .insert({ name: input.householdName, owner_user_id: userId })
    .select("id")
    .single();
  if (householdError || !household) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Não foi possível criar o household." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userId,
    household_id: household.id,
    name: input.name,
    email: input.email,
    role: "admin",
    status: "active",
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Não foi possível criar o perfil de administrador." };
  }

  const { error: categoriesError } = await admin.rpc("create_default_categories", {
    p_household_id: household.id,
    p_created_by: userId,
  });
  if (categoriesError) {
    return { error: "Admin criado, mas houve falha ao gerar categorias padrão." };
  }

  return {};
}
