"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createIncome, updateIncome, type IncomeInput } from "@/actions/incomes";
import { createIncomeRecurrence } from "@/actions/income-recurrences";
import { todayISO } from "@/lib/format";
import type { Category, IncomeType, RecurrenceFrequency } from "@/types/database";

export interface IncomeFormInitialValues extends IncomeInput {
  id: string;
}

const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  monthly: "Mensal",
  biweekly: "Quinzenal",
  weekly: "Semanal",
  yearly: "Anual",
  custom: "Personalizada",
};

export function IncomeForm({
  open,
  onClose,
  categories,
  accounts,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  categories: Pick<Category, "id" | "name">[];
  accounts: { id: string; name: string }[];
  initialValues?: IncomeFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<IncomeInput>(
    initialValues ?? {
      description: "",
      amount: 0,
      category_id: categories[0]?.id ?? "",
      account_id: accounts[0]?.id ?? "",
      income_type: "variable",
      expected_date: todayISO(),
      is_shared: false,
      notes: "",
    }
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [customIntervalDays, setCustomIntervalDays] = useState(30);
  const [hasEndDate, setHasEndDate] = useState(true);
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof IncomeInput>(key: K, value: IncomeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let result: { error?: string };
    if (isEditing && initialValues) {
      result = await updateIncome(initialValues.id, form);
    } else if (form.income_type === "recurring") {
      if (hasEndDate && !endDate) {
        setIsSubmitting(false);
        setError("Informe a data final ou marque \"sem data final\".");
        return;
      }
      result = await createIncomeRecurrence({
        description: form.description,
        amount: form.amount,
        category_id: form.category_id,
        account_id: form.account_id,
        is_shared: form.is_shared,
        notes: form.notes,
        frequency,
        custom_interval_days: frequency === "custom" ? customIntervalDays : null,
        start_date: form.expected_date,
        end_date: hasEndDate ? endDate : null,
      });
    } else {
      result = await createIncome(form);
    }

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar entrada" : "Nova entrada"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Descrição"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount || ""}
            onChange={(e) => update("amount", Number(e.target.value))}
          />
          <Input
            label={form.income_type === "recurring" ? "Data inicial" : "Data prevista"}
            type="date"
            required
            value={form.expected_date}
            onChange={(e) => update("expected_date", e.target.value)}
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
            value={form.income_type}
            disabled={isEditing}
            onChange={(e) => update("income_type", e.target.value as IncomeType)}
          >
            <option value="fixed">Fixa</option>
            <option value="variable">Variável</option>
            <option value="recurring">Recorrente</option>
          </Select>
        </div>

        {form.income_type === "recurring" && !isEditing ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-border-subtle p-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Frequência"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              >
                {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {frequency === "custom" ? (
                <Input
                  label="A cada quantos dias"
                  type="number"
                  min={1}
                  required
                  value={customIntervalDays}
                  onChange={(e) => setCustomIntervalDays(Number(e.target.value))}
                />
              ) : (
                <label className="flex h-11 items-end gap-2 pb-2.5 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={!hasEndDate}
                    onChange={(e) => setHasEndDate(!e.target.checked)}
                    className="h-4 w-4 rounded border-border-subtle"
                  />
                  Sem data final
                </label>
              )}
            </div>
            {frequency === "custom" ? (
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={!hasEndDate}
                  onChange={(e) => setHasEndDate(!e.target.checked)}
                  className="h-4 w-4 rounded border-border-subtle"
                />
                Sem data final
              </label>
            ) : null}
            {hasEndDate ? (
              <Input
                label="Data final da recorrência"
                type="date"
                required
                min={form.expected_date}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            ) : (
              <p className="text-xs text-text-secondary">
                O sistema mantém sempre os próximos ~24 meses de ocorrências gerados automaticamente.
              </p>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 items-end">
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
          <label className="flex h-11 items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.is_shared ?? false}
              onChange={(e) => update("is_shared", e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle"
            />
            Compartilhada com a família
          </label>
        </div>

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
            {isEditing ? "Salvar alterações" : "Criar entrada"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
