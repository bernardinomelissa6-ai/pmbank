"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCategory, updateCategory, type CategoryInput } from "@/actions/categories";
import type { CategoryType } from "@/types/database";

export interface CategoryFormInitialValues extends CategoryInput {
  id: string;
}

export function CategoryForm({
  open,
  onClose,
  defaultType,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  defaultType: CategoryType;
  initialValues?: CategoryFormInitialValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<CategoryInput>(
    initialValues ?? { name: "", type: defaultType, color: "#2563EB" }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = isEditing && initialValues ? await updateCategory(initialValues.id, form) : await createCategory(form);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar categoria" : "Nova categoria"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" value={form.type} onChange={(e) => update("type", e.target.value as CategoryType)}>
            <option value="expense">Gasto</option>
            <option value="income">Entrada</option>
          </Select>
          <Input label="Cor" type="color" value={form.color ?? "#2563EB"} onChange={(e) => update("color", e.target.value)} />
        </div>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
