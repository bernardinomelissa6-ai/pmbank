"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createAccount, updateAccount, type AccountInput } from "@/actions/accounts";
import type { AccountType } from "@/types/database";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  bank: "Banco",
  wallet: "Carteira digital",
  cash: "Dinheiro",
  pix: "Pix",
  joint: "Conta conjunta",
};

export interface AccountFormInitialValues extends AccountInput {
  id: string;
}

export function AccountForm({
  open,
  onClose,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  initialValues?: AccountFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<AccountInput>(
    initialValues ?? { name: "", type: "bank", initial_balance: 0 }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof AccountInput>(key: K, value: AccountInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = isEditing && initialValues ? await updateAccount(initialValues.id, form) : await createAccount(form);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar conta" : "Nova conta"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" value={form.type} onChange={(e) => update("type", e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Saldo inicial"
            type="number"
            step="0.01"
            disabled={isEditing}
            value={form.initial_balance}
            onChange={(e) => update("initial_balance", Number(e.target.value))}
          />
        </div>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Salvar alterações" : "Criar conta"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
