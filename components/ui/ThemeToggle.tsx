"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "casaflow-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage indisponível (modo privado etc.) — o tema não persiste, mas segue funcionando.
    }
  }

  if (theme === null) {
    return <div className={cn("h-9 w-9", className)} />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary",
        className
      )}
    >
      {theme === "dark" ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
    </button>
  );
}
