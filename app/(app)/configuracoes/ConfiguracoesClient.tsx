"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateOwnName, updateHouseholdName } from "@/actions/profile";
import { deleteCategory } from "@/actions/categories";
import { CategoryForm, type CategoryFormInitialValues } from "./CategoryForm";
import type { Category, Household, Profile } from "@/types/database";

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-text-secondary">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function ConfiguracoesClient({
  profile,
  household,
  categories,
}: {
  profile: Profile;
  household: Pick<Household, "id" | "name">;
  categories: Category[];
}) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";

  const [name, setName] = useState(profile.name);
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState(household.name);
  const [householdStatus, setHouseholdStatus] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryFormType, setCategoryFormType] = useState<"income" | "expense">("expense");
  const [editingCategory, setEditingCategory] = useState<CategoryFormInitialValues | undefined>(undefined);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function handleSaveName(event: React.FormEvent) {
    event.preventDefault();
    setNameStatus(null);
    const result = await updateOwnName(name);
    setNameStatus(result.error ?? "Nome atualizado.");
    router.refresh();
  }

  async function handleSaveHousehold(event: React.FormEvent) {
    event.preventDefault();
    setHouseholdStatus(null);
    const result = await updateHouseholdName(householdName);
    setHouseholdStatus(result.error ?? "Nome da família atualizado.");
    router.refresh();
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordStatus(null);
    if (password.length < 6) {
      setPasswordStatus("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setIsSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsSavingPassword(false);
    setPassword("");
    setPasswordStatus(error ? error.message : "Senha atualizada com sucesso.");
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Configurações</h1>
        <p className="text-sm text-text-secondary">Perfil, família, categorias e preferências.</p>
      </div>

      <SectionCard title="Perfil">
        <form onSubmit={handleSaveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button type="submit">Salvar</Button>
        </form>
        {nameStatus ? <p className="mt-2 text-xs text-text-secondary">{nameStatus}</p> : null}
      </SectionCard>

      <SectionCard title="Senha" description="Troque sua senha de acesso ao CasaFlow.">
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Nova senha"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" isLoading={isSavingPassword}>
            Atualizar senha
          </Button>
        </form>
        {passwordStatus ? <p className="mt-2 text-xs text-text-secondary">{passwordStatus}</p> : null}
      </SectionCard>

      {isAdmin ? (
        <SectionCard title="Família" description="Nome do household exibido para todos os membros.">
          <form onSubmit={handleSaveHousehold} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input label="Nome da família" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} className="flex-1" />
            <Button type="submit">Salvar</Button>
          </form>
          {householdStatus ? <p className="mt-2 text-xs text-text-secondary">{householdStatus}</p> : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Categorias" description="Usadas em entradas e gastos.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Gastos</p>
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCategoryFormType("expense");
                    setEditingCategory(undefined);
                    setCategoryFormOpen(true);
                  }}
                >
                  + Adicionar
                </Button>
              ) : null}
            </div>
            <ul className="flex flex-col gap-1.5">
              {expenseCategories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-text-primary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color ?? "#64748B" }} />
                    {category.name}
                    {category.is_default ? <Badge>padrão</Badge> : null}
                  </span>
                  {isAdmin ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCategoryFormType("expense");
                          setEditingCategory({ id: category.id, name: category.name, type: category.type, color: category.color ?? undefined });
                          setCategoryFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-negative" onClick={() => setPendingDeleteId(category.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Entradas</p>
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCategoryFormType("income");
                    setEditingCategory(undefined);
                    setCategoryFormOpen(true);
                  }}
                >
                  + Adicionar
                </Button>
              ) : null}
            </div>
            <ul className="flex flex-col gap-1.5">
              {incomeCategories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-text-primary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color ?? "#64748B" }} />
                    {category.name}
                    {category.is_default ? <Badge>padrão</Badge> : null}
                  </span>
                  {isAdmin ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCategoryFormType("income");
                          setEditingCategory({ id: category.id, name: category.name, type: category.type, color: category.color ?? undefined });
                          setCategoryFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-negative" onClick={() => setPendingDeleteId(category.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferências">
        <p className="text-sm text-text-secondary">
          CasaFlow · household <strong>{household.name}</strong>. Mais preferências (moeda, notificações) chegam em versões futuras.
        </p>
      </SectionCard>

      <CategoryForm
        key={editingCategory?.id ?? "new"}
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        defaultType={categoryFormType}
        initialValues={editingCategory}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir categoria"
        description="Lançamentos que usam esta categoria ficarão sem categoria."
        confirmLabel="Excluir"
        danger
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (pendingDeleteId) {
            await deleteCategory(pendingDeleteId);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
