import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: hasAdmin } = await supabase.rpc("system_has_admin");

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">CasaFlow</h1>
          <p className="mt-1 text-sm text-text-secondary">Financeiro da sua família, em um só lugar.</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-6">
          <LoginForm />
        </div>

        {!hasAdmin ? (
          <p className="mt-6 text-center text-sm text-text-secondary">
            Primeiro acesso ao sistema?{" "}
            <Link href="/setup" className="font-medium text-brand-blue hover:underline">
              Criar primeiro acesso
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
