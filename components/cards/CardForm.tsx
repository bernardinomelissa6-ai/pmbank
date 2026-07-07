"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCard, updateCard, type CardInput } from "@/actions/cards";

export interface CardFormInitialValues extends CardInput {
  id: string;
}

export function CardForm({
  open,
  onClose,
  accounts,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  initialValues?: CardFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<CardInput>(
    initialValues ?? { name: "", account_id: accounts[0]?.id ?? "", limit_amount: undefined, closing_day: 1, due_day: 10 }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof CardInput>(key: K, value: CardInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = isEditing && initialValues ? await updateCard(initialValues.id, form) : await createCard(form);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar cartão" : "Novo cartão"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Limite"
            type="number"
            step="0.01"
            value={form.limit_amount ?? ""}
            onChange={(e) => update("limit_amount", e.target.value ? Number(e.target.value) : null)}
          />
          <Select
            label="Conta de pagamento"
            value={form.account_id ?? ""}
            onChange={(e) => update("account_id", e.target.value)}
          >
            <option value="">Sem conta vinculada</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dia de fechamento"
            type="number"
            min={1}
            max={31}
            value={form.closing_day ?? ""}
            onChange={(e) => update("closing_day", e.target.value ? Number(e.target.value) : null)}
          />
          <Input
            label="Dia de vencimento"
            type="number"
            min={1}
            max={31}
            value={form.due_day ?? ""}
            onChange={(e) => update("due_day", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Salvar alterações" : "Criar cartão"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
