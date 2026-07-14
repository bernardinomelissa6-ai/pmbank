"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MONTH_NAMES } from "@/lib/format";

function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function MonthNav({ month, year }: { month: number; year: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  function go(targetMonth: number, targetYear: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(targetMonth));
    params.set("year", String(targetYear));
    router.push(`/dashboard?${params.toString()}`);
  }

  function goPrev() {
    if (month === 1) go(12, year - 1);
    else go(month - 1, year);
  }

  function goNext() {
    if (month === 12) go(1, year + 1);
    else go(month + 1, year);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface p-1">
      <button
        type="button"
        onClick={goPrev}
        aria-label="Mês anterior"
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      >
        <IconChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[110px] text-center text-sm font-medium text-text-primary">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        type="button"
        onClick={goNext}
        aria-label="Próximo mês"
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>
      {!isCurrentMonth ? (
        <button
          type="button"
          onClick={() => go(now.getMonth() + 1, now.getFullYear())}
          className="ml-1 rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/20"
        >
          Hoje
        </button>
      ) : null}
    </div>
  );
}
