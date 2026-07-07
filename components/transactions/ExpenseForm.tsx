"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createExpense, updateExpense, type ExpenseInput } from "@/actions/expenses";
import { todayISO } from "@/lib/format";
import type { Category, ExpenseType, PaymentMethod } from "@/types/database";

export interface ExpenseFormInitialValues extends ExpenseInput {
  id: string;
}

export function ExpenseForm({
  open,
  onClose,
  categories,
  accounts,
  cards,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  categories: Pick<Category, "id" | "name">[];
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  initialValues?: ExpenseFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<ExpenseInput>(
    initialValues ?? {
      description: "",
      amount: 0,
      category_id: categories[0]?.id ?? "",
      account_id: accounts[0]?.id ?? "",
      card_id: "",
      expense_type: "variable",
      due_date: todayISO(),
      payment_method: "pix",
      is_shared: false,
      total_installments: 2,
      recurrence_end_date: "",
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = isEditing && initialValues
      ? await updateExpense(initialValues.id, form)
      : await createExpense(form);

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar gasto" : "Novo gasto"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Descrição"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={form.expense_type === "installment" ? "Valor total da compra" : "Valor"}
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount || ""}
            onChange={(e) => update("amount", Number(e.target.value))}
          />
          <Input
            label={form.expense_type === "installment" ? "Data da 1ª parcela" : "Vencimento"}
            type="date"
            required
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
          />
        </div>
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
            label="Tipo"
            value={form.expense_type}
            onChange={(e) => update("expense_type", e.target.value as ExpenseType)}
            disabled={isEditing}
          >
            <option value="fixed">Fixo</option>
            <option value="variable">Variável</option>
            <option value="recurring">Recorrente</option>
            <option value="installment">Parcelado</option>
          </Select>
        </div>

        {form.expense_type === "installment" ? (
          <Input
            label="Número de parcelas"
            type="number"
            min={2}
            max={60}
            required
            disabled={isEditing}
            value={form.total_installments ?? 2}
            onChange={(e) => update("total_installments", Number(e.target.value))}
          />
        ) : null}

        {form.expense_type === "recurring" && !isEditing ? (
          <Input
            label="Data final da recorrência"
            type="date"
            required
            min={form.due_date}
            hint="Um lançamento será criado para cada mês, até essa data."
            value={form.recurrence_end_date ?? ""}
            onChange={(e) => update("recurrence_end_date", e.target.value)}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Forma de pagamento"
            value={form.payment_method ?? ""}
            onChange={(e) => update("payment_method", e.target.value as PaymentMethod)}
          >
            <option value="pix">Pix</option>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
            <option value="cash">Dinheiro</option>
            <option value="transfer">Transferência</option>
            <option value="boleto">Boleto</option>
            <option value="other">Outro</option>
          </Select>
          <Select label="Cartão" value={form.card_id ?? ""} onChange={(e) => update("card_id", e.target.value)}>
            <option value="">Sem cartão</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <Select
            label="Conta de débito"
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
          <label className="flex h-11 items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.is_shared ?? false}
              onChange={(e) => update("is_shared", e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle"
            />
            Compartilhado com a família
          </label>
        </div>

        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Salvar alterações" : "Criar gasto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
