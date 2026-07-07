"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setIsSubmitting(false);
      setError("E-mail ou senha inválidos.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profile?.status === "inactive") {
      await supabase.auth.signOut();
      setIsSubmitting(false);
      setError("Seu acesso está desativado. Fale com o administrador da família.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="text-sm text-negative">{error}</p> : null}
      <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
        Entrar
      </Button>
    </form>
  );
}
