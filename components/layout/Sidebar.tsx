"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, MORE_NAV } from "@/components/layout/nav-items";
import { IconLogout } from "@/components/layout/icons";
import type { Role } from "@/types/database";
import { signOutAction } from "@/actions/auth";

export function Sidebar({
  role,
  name,
  householdName,
}: {
  role: Role;
  name: string;
  householdName: string;
}) {
  const pathname = usePathname();
  const items = [...PRIMARY_NAV, ...MORE_NAV].filter((item) => !item.adminOnly || role === "admin");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface px-4 py-6 sm:flex">
      <div className="mb-8 px-2">
        <p className="text-lg font-semibold tracking-tight text-text-primary">CasaFlow</p>
        <p className="text-xs text-text-secondary">{householdName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-blue-50 text-brand-blue" : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
              )}
            >
              <ItemIcon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <p className="truncate px-3 text-sm font-medium text-text-primary">{name}</p>
        <p className="px-3 text-xs capitalize text-text-secondary">{role === "admin" ? "Administrador" : "Membro"}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-100 hover:text-text-primary"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
