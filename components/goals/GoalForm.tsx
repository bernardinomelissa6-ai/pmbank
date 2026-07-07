"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createGoal, updateGoal, type GoalInput } from "@/actions/goals";

export interface GoalFormInitialValues extends GoalInput {
  id: string;
}

export function GoalForm({
  open,
  onClose,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  initialValues?: GoalFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<GoalInput>(
    initialValues ?? { name: "", target_amount: 0, current_amount: 0, deadline: "", is_shared: false }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof GoalInput>(key: K, value: GoalInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = isEditing && initialValues ? await updateGoal(initialValues.id, form) : await createGoal(form);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar meta" : "Nova meta"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome da meta" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor alvo"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.target_amount || ""}
            onChange={(e) => update("target_amount", Number(e.target.value))}
          />
          <Input
            label="Valor atual"
            type="number"
            step="0.01"
            min="0"
            value={form.current_amount ?? 0}
            onChange={(e) => update("current_amount", Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <Input
            label="Prazo"
            type="date"
            value={form.deadline ?? ""}
            onChange={(e) => update("deadline", e.target.value)}
          />
          <label className="flex h-11 items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.is_shared ?? false}
              onChange={(e) => update("is_shared", e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle"
            />
            Meta compartilhada
          </label>
        </div>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Salvar alterações" : "Criar meta"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
