"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, MORE_NAV } from "@/components/layout/nav-items";
import { IconMenu, IconLogout } from "@/components/layout/icons";
import { Modal } from "@/components/ui/Modal";
import { signOutAction } from "@/actions/auth";
import type { Role } from "@/types/database";

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = MORE_NAV.filter((item) => !item.adminOnly || role === "admin");
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        {PRIMARY_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-brand-blue" : "text-text-secondary"
              )}
            >
              <ItemIcon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
            isMoreActive ? "text-brand-blue" : "text-text-secondary"
          )}
        >
          <IconMenu className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais opções">
        <div className="grid grid-cols-3 gap-3">
          {moreItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 rounded-[var(--radius-control)] border border-border-subtle p-3 text-center text-xs font-medium text-text-primary hover:bg-slate-50"
              >
                <ItemIcon className="h-5 w-5 text-brand-blue" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <form action={signOutAction} className="mt-4 border-t border-border-subtle pt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] py-2.5 text-sm font-medium text-negative hover:bg-red-50"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            Sair da conta
          </button>
        </form>
      </Modal>
    </>
  );
}
