"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AccountForm, ACCOUNT_TYPE_LABEL, type AccountFormInitialValues } from "@/components/accounts/AccountForm";
import { deleteAccount } from "@/actions/accounts";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/types/database";

export function ContasClient({ accounts, isAdmin }: { accounts: Account[]; isAdmin: boolean }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountFormInitialValues | undefined>(undefined);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Contas</h1>
          <p className="text-sm text-text-secondary">Bancos, carteiras, dinheiro e contas conjuntas.</p>
        </div>
        {isAdmin ? (
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Nova conta
          </Button>
        ) : null}
      </div>

      {accounts.length === 0 ? (
        <EmptyState title="Nenhuma conta cadastrada" description="Peça para o administrador criar a primeira conta." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-text-primary">{account.name}</p>
                  <p className="text-xs text-text-secondary">{ACCOUNT_TYPE_LABEL[account.type]}</p>
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-text-primary">{formatCurrency(account.current_balance)}</p>
              <p className="text-xs text-text-secondary">Saldo inicial: {formatCurrency(account.initial_balance)}</p>
              {isAdmin ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing({ id: account.id, name: account.name, type: account.type, initial_balance: account.initial_balance });
                      setFormOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-negative" onClick={() => setPendingDeleteId(account.id)}>
                    Excluir
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <AccountForm open={formOpen} onClose={() => setFormOpen(false)} initialValues={editing} />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir conta"
        description="Os lançamentos vinculados perderão a referência a esta conta."
        confirmLabel="Excluir"
        danger
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (pendingDeleteId) {
            await deleteAccount(pendingDeleteId);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
