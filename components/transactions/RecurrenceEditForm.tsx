"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateIncomeRecurrence, type IncomeRecurrenceUpdateInput } from "@/actions/income-recurrences";
import type { Category, IncomeRecurrence } from "@/types/database";

export function RecurrenceEditForm({
  open,
  onClose,
  categories,
  accounts,
  rule,
}: {
  open: boolean;
  onClose: () => void;
  categories: Pick<Category, "id" | "name">[];
  accounts: { id: string; name: string }[];
  rule: IncomeRecurrence;
}) {
  const router = useRouter();
  const [form, setForm] = useState<IncomeRecurrenceUpdateInput>({
    description: rule.description,
    amount: rule.amount,
    category_id: rule.category_id,
    account_id: rule.account_id,
    is_shared: rule.is_shared,
    notes: rule.notes,
    end_date: rule.end_date,
  });
  const [hasEndDate, setHasEndDate] = useState(Boolean(rule.end_date));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof IncomeRecurrenceUpdateInput>(key: K, value: IncomeRecurrenceUpdateInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateIncomeRecurrence(rule.id, {
      ...form,
      end_date: hasEndDate ? form.end_date : null,
    });

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar recorrência">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-text-secondary">
          As alterações afetam somente as ocorrências futuras ainda não recebidas.
        </p>
        <Input
          label="Descrição"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <Input
          label="Valor"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.amount || ""}
          onChange={(e) => update("amount", Number(e.target.value))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoria"
            value={form.category_id ?? ""}
            onChange={(e) => update("category_id", e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Conta de destino"
            value={form.account_id ?? ""}
            onChange={(e) => update("account_id", e.target.value)}
          >
            <option value="">Sem conta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={!hasEndDate}
              onChange={(e) => setHasEndDate(!e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle"
            />
            Sem data final
          </label>
          {hasEndDate ? (
            <Input
              label="Data final"
              type="date"
              required
              value={form.end_date ?? ""}
              onChange={(e) => update("end_date", e.target.value)}
            />
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={form.is_shared ?? false}
            onChange={(e) => update("is_shared", e.target.checked)}
            className="h-4 w-4 rounded border-border-subtle"
          />
          Compartilhada com a família
        </label>

        <Textarea
          label="Observações (opcional)"
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
        />

        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
