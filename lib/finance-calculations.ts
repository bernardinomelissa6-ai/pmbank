import type { Expense, Income, Installment, FinancialGoal } from "@/types/database";
import { MONTH_NAMES } from "@/lib/format";

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((acc, item) => acc + (pick(item) ?? 0), 0);
}

export function totalIncomeMonth(incomes: Income[]): number {
  return sum(incomes, (i) => i.amount);
}

export function receivedIncome(incomes: Income[]): number {
  return sum(incomes.filter((i) => i.status === "received"), (i) => i.amount);
}

export function expectedIncome(incomes: Income[]): number {
  return sum(incomes.filter((i) => i.status === "expected"), (i) => i.amount);
}

/**
 * `expenses` deve conter apenas lançamentos com expense_type !== 'installment'
 * (o valor de uma compra parcelada só entra na projeção através de `installments`,
 * nunca pelo valor cheio da compra, para não duplicar o gasto no mês).
 */
export function totalExpenseMonth(expenses: Expense[], installments: Installment[]): number {
  return sum(expenses, (e) => e.amount) + sum(installments, (i) => i.amount);
}

export function paidExpense(expenses: Expense[], installments: Installment[]): number {
  return (
    sum(expenses.filter((e) => e.status === "paid"), (e) => e.amount) +
    sum(installments.filter((i) => i.status === "paid"), (i) => i.amount)
  );
}

export function openExpense(expenses: Expense[], installments: Installment[]): number {
  return (
    sum(expenses.filter((e) => e.status === "open"), (e) => e.amount) +
    sum(installments.filter((i) => i.status === "open"), (i) => i.amount)
  );
}

export function lateExpense(
  expenses: Expense[],
  installments: Installment[],
  today = new Date().toISOString().slice(0, 10)
): number {
  return (
    sum(
      expenses.filter((e) => e.status === "open" && e.due_date < today),
      (e) => e.amount
    ) +
    sum(
      installments.filter((i) => i.status === "open" && i.due_date < today),
      (i) => i.amount
    )
  );
}

export function currentBalance(receivedIncomeAmount: number, paidExpenseAmount: number): number {
  return receivedIncomeAmount - paidExpenseAmount;
}

export function projectedBalance(
  receivedIncomeAmount: number,
  expectedIncomeAmount: number,
  paidExpenseAmount: number,
  openExpenseAmount: number
): number {
  return receivedIncomeAmount + expectedIncomeAmount - paidExpenseAmount - openExpenseAmount;
}

export function suggestedDailyLimit(projectedBalanceAmount: number, daysRemaining: number): number {
  if (daysRemaining <= 0) return 0;
  return projectedBalanceAmount / daysRemaining;
}

export interface MonthProjection {
  month: number;
  year: number;
  label: string;
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
  isNegative: boolean;
}

function filterByMonth<T extends { due_date: string } | { expected_date: string }>(
  items: T[],
  dateKey: "due_date" | "expected_date",
  month: number,
  year: number
): T[] {
  return items.filter((item) => {
    const raw = (item as Record<string, string>)[dateKey];
    const date = new Date(`${raw}T00:00:00`);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
}

/**
 * Projeta os próximos `monthsAhead` meses. Entradas/gastos `fixed` não são materializados
 * por mês (repetem o valor do mês atual todo mês, extrapolado). Entradas/gastos `recurring`
 * já existem como linhas reais com data futura (geradas na criação, com data final) — por
 * isso `futureIncomes`/`futureExpenses` devem vir de uma busca sem filtro de mês, cobrindo
 * a janela inteira de `monthsAhead`, e são somados por mês real, evitando duplicar o que já
 * está materializado. Parcelas de installments seguem o mesmo princípio.
 */
export function projectFutureMonths(params: {
  fixedIncomes: Pick<Income, "amount">[];
  fixedExpenses: Pick<Expense, "amount">[];
  futureIncomes: Pick<Income, "amount" | "expected_date">[];
  futureExpenses: Pick<Expense, "amount" | "due_date">[];
  installments: Pick<Installment, "amount" | "due_date">[];
  monthsAhead: number;
  startDate?: Date;
}): MonthProjection[] {
  const { fixedIncomes, fixedExpenses, futureIncomes, futureExpenses, installments, monthsAhead } = params;
  const start = params.startDate ?? new Date();
  const baseIncome = sum(fixedIncomes, (i) => i.amount);
  const baseExpense = sum(fixedExpenses, (e) => e.amount);

  const results: MonthProjection[] = [];
  for (let offset = 1; offset <= monthsAhead; offset += 1) {
    const target = new Date(start.getFullYear(), start.getMonth() + offset, 1);
    const month = target.getMonth() + 1;
    const year = target.getFullYear();

    const monthIncome = sum(filterByMonth(futureIncomes, "expected_date", month, year), (i) => i.amount);
    const monthExpense = sum(filterByMonth(futureExpenses, "due_date", month, year), (e) => e.amount);
    const monthInstallments = sum(filterByMonth(installments, "due_date", month, year), (i) => i.amount);

    const totalIncome = baseIncome + monthIncome;
    const totalExpense = baseExpense + monthExpense + monthInstallments;
    const balance = totalIncome - totalExpense;

    results.push({
      month,
      year,
      label: `${MONTH_NAMES[month - 1]}/${year}`,
      totalIncome,
      totalExpense,
      projectedBalance: balance,
      isNegative: balance < 0,
    });
  }
  return results;
}

export function goalProgress(goal: Pick<FinancialGoal, "current_amount" | "target_amount">): number {
  if (!goal.target_amount) return 0;
  return Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100));
}

export function goalSuggestedMonthly(
  goal: Pick<FinancialGoal, "current_amount" | "target_amount" | "deadline">,
  today = new Date()
): number {
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return 0;
  if (!goal.deadline) return remaining;

  const deadline = new Date(`${goal.deadline}T00:00:00`);
  const months = Math.max(
    1,
    (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth())
  );
  return remaining / months;
}
