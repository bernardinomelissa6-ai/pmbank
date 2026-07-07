"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFirstAdmin } from "@/actions/setup";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SetupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ householdName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createFirstAdmin(form);
    if (result.error) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) {
      setIsSubmitting(false);
      setError("Admin criado, mas o login automático falhou. Faça login manualmente.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome da família / household"
        placeholder="Família Silva"
        required
        value={form.householdName}
        onChange={(e) => update("householdName", e.target.value)}
      />
      <Input
        label="Seu nome"
        required
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
      />
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
      />
      <Input
        label="Senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
      />
      {error ? <p className="text-sm text-negative">{error}</p> : null}
      <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
        Criar administrador
      </Button>
    </form>
  );
}
