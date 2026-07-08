import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth-guards";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const profile = await getCurrentProfile();
  if (profile && profile.status === "active") redirect("/dashboard");

  const supabase = await createClient();
  const { data: hasAdmin } = await supabase.rpc("system_has_admin");

  if (hasAdmin) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border-subtle bg-surface p-6 text-center">
          <h1 className="text-lg font-semibold text-text-primary">Já existe um administrador</h1>
          <p className="mt-2 text-sm text-text-secondary">
            O cadastro público está desativado. Peça para o administrador da família te criar em /usuarios.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Criar CasaFlow</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Você será o administrador da família. Depois disso, novos usuários só entram por convite seu.
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
