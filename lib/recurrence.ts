import type { RecurrenceFrequency } from "@/types/database";

export function generateRecurringDates(firstDate: string, endDate: string): string[] {
  const [year, month, day] = firstDate.split("-").map(Number);
  const end = new Date(`${endDate}T00:00:00`);

  const dates: string[] = [];
  for (let offset = 0; offset < 240; offset += 1) {
    const current = new Date(year, month - 1 + offset, day);
    if (current > end) break;
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}

const MAX_OCCURRENCES = 1000;

function stepDate(base: Date, frequency: RecurrenceFrequency, step: number, customIntervalDays?: number): Date {
  switch (frequency) {
    case "weekly":
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7 * step);
    case "biweekly":
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 14 * step);
    case "yearly":
      return new Date(base.getFullYear() + step, base.getMonth(), base.getDate());
    case "custom":
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + (customIntervalDays ?? 30) * step);
    case "monthly":
    default:
      return new Date(base.getFullYear(), base.getMonth() + step, base.getDate());
  }
}

/**
 * Gera as datas de ocorrência entre `startDate` (exclusive quando `fromOffset` > 0, para
 * continuar uma série já gerada) e `windowEndDate` (inclusive), respeitando a frequência.
 * Usado tanto na criação de uma recorrência quanto na renovação automática da janela.
 */
export function generateOccurrenceDates(params: {
  startDate: string;
  windowEndDate: string;
  frequency: RecurrenceFrequency;
  customIntervalDays?: number;
  fromOffset?: number;
}): string[] {
  const [year, month, day] = params.startDate.split("-").map(Number);
  const base = new Date(year, month - 1, day);
  const end = new Date(`${params.windowEndDate}T00:00:00`);
  const startOffset = params.fromOffset ?? 0;

  const dates: string[] = [];
  for (let step = startOffset; step < startOffset + MAX_OCCURRENCES; step += 1) {
    const current = stepDate(base, params.frequency, step, params.customIntervalDays);
    if (current > end) break;
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}
