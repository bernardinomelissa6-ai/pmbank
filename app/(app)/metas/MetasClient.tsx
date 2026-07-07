"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm, type GoalFormInitialValues } from "@/components/goals/GoalForm";
import { deleteGoal } from "@/actions/goals";
import type { FinancialGoal } from "@/types/database";

export function MetasClient({ currentUserId, goals }: { currentUserId: string; goals: FinancialGoal[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalFormInitialValues | undefined>(undefined);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Metas</h1>
          <p className="text-sm text-text-secondary">Objetivos financeiros da família e progresso.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState title="Nenhuma meta cadastrada" description="Crie a primeira meta financeira da família." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              canManage={goal.user_id === currentUserId}
              onEdit={() => {
                setEditing({
                  id: goal.id,
                  name: goal.name,
                  target_amount: goal.target_amount,
                  current_amount: goal.current_amount,
                  deadline: goal.deadline,
                  is_shared: goal.is_shared,
                });
                setFormOpen(true);
              }}
              onDelete={() => setPendingDeleteId(goal.id)}
            />
          ))}
        </div>
      )}

      <GoalForm open={formOpen} onClose={() => setFormOpen(false)} initialValues={editing} />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir meta"
        confirmLabel="Excluir"
        danger
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (pendingDeleteId) {
            await deleteGoal(pendingDeleteId);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
