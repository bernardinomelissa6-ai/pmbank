"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createHouseholdUser, updateUserRole, updateUserStatus } from "@/actions/users";
import type { Profile } from "@/types/database";

export function UsuariosClient({ currentProfileId, members }: { currentProfileId: string; members: Profile[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await createHouseholdUser(form);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm({ name: "", email: "", password: "" });
    setCreateOpen(false);
    router.refresh();
  }

  async function toggleRole(member: Profile) {
    await updateUserRole(member.id, member.role === "admin" ? "member" : "admin");
    router.refresh();
  }

  async function toggleStatus(member: Profile) {
    await updateUserStatus(member.id, member.status === "active" ? "inactive" : "active");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Usuários</h1>
          <p className="text-sm text-text-secondary">Gerencie quem tem acesso ao CasaFlow da sua família.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Novo usuário</Button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {members.map((member) => {
              const isSelf = member.id === currentProfileId;
              return (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{member.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={member.role === "admin" ? "brand" : "neutral"}>
                      {member.role === "admin" ? "Administrador" : "Membro"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={member.status === "active" ? "positive" : "neutral"}>
                      {member.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-text-secondary">Sua conta</span>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => toggleRole(member)}>
                          {member.role === "admin" ? "Tornar membro" : "Tornar admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={member.status === "active" ? "text-negative" : "text-positive"}
                          onClick={() => toggleStatus(member)}
                        >
                          {member.status === "active" ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo usuário">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Nome"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="Senha"
            type="text"
            required
            minLength={6}
            hint="A pessoa já entra direto com esse e-mail e senha. Pode trocar depois em Configurações."
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {error ? <p className="text-sm text-negative">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Criar usuário
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
