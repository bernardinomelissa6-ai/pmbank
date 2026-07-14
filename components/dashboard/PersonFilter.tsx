"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Input";

export function PersonFilter({
  person,
  options,
}: {
  person: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("person");
    else params.set("person", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      value={person}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filtrar por pessoa"
      className="h-11 w-auto min-w-[170px]"
    >
      <option value="all">Todas as pessoas</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
