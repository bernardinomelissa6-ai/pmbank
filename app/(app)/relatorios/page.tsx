import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { PersonBarChart } from "@/components/charts/PersonBarChart";
import {
  receivedIncome,
  expectedIncome,
  paidExpense,
  openExpense,
  currentBalance,
  projectFutureMonths,
} from "@/lib/finance-calculations";
import { addMonths, monthRange, MONTH_NAMES } from "@/lib/format";
import { RelatoriosClient } from "./RelatoriosClient";
import type { Expense, Income, Installment } from "@/types/database";

export default async function RelatoriosPage() {
  await requireProfile();
  const supabase = await createClient();

  const now = new Date();
  const previous = addMonths(now, -1);
  const currentRange = monthRange(now.getMonth() + 1, now.getFullYear());
  const previousRange = monthRange(previous.getMonth() + 1, previous.getFullYear());

  const historyStart = addMonths(now, -5);
  const historyStartISO = monthRange(historyStart.getMonth() + 1, historyStart.getFullYear()).startISO;

  const projectionEnd = addMonths(now, 12);
  const projectionEndISO = monthRange(projectionEnd.getMonth() + 1, projectionEnd.getFullYear()).endISO;

  const [
    { data: incomesCurrent },
    { data: expensesCurrent },
    { data: installmentsCurrent },
    { data: incomesPrevious },
    { data: expensesPrevious },
    { data: installmentsPrevious },
    { data: incomesHistory },
    { data: expensesHistory },
    { data: installmentsHistory },
    { data: fixedIncomes },
    { data: fixedExpenses },
    { data: futureIncomes },
    { data: futureExpenses },
    { data: openInstallments },
    { data: members },
  ] = await Promise.all([
    supabase.from("incomes").select("*").gte("expected_date", currentRange.startISO).lte("expected_date", currentRange.endISO),
    supabase
      .from("expenses")
      .select("*, category:categories(name)")
      .neq("expense_type", "installment")
      .gte("due_date", currentRange.startISO)
      .lte("due_date", currentRange.endISO),
    supabase.from("installments").select("*").gte("due_date", currentRange.startISO).lte("due_date", currentRange.endISO),
    supabase.from("incomes").select("*").gte("expected_date", previousRange.startISO).lte("expected_date", previousRange.endISO),
    supabase
      .from("expenses")
      .select("*")
      .neq("expense_type", "installment")
      .gte("due_date", previousRange.startISO)
      .lte("due_date", previousRange.endISO),
    supabase.from("installments").select("*").gte("due_date", previousRange.startISO).lte("due_date", previousRange.endISO),
    supabase.from("incomes").select("amount, status, expected_date").gte("expected_date", historyStartISO).lte("expected_date", currentRange.endISO),
    supabase
      .from("expenses")
      .select("amount, status, due_date")
      .neq("expense_type", "installment")
      .gte("due_date", historyStartISO)
      .lte("due_date", currentRange.endISO),
    supabase.from("installments").select("amount, status, due_date").gte("due_date", historyStartISO).lte("due_date", currentRange.endISO),
    supabase.from("incomes").select("*").eq("income_type", "fixed").gte("expected_date", currentRange.startISO).lte("expected_date", currentRange.endISO),
    supabase.from("expenses").select("*").eq("expense_type", "fixed").gte("due_date", currentRange.startISO).lte("due_date", currentRange.endISO),
    supabase
      .from("incomes")
      .select("amount, expected_date")
      .neq("income_type", "fixed")
      .gt("expected_date", currentRange.endISO)
      .lte("expected_date", projectionEndISO),
    supabase
      .from("expenses")
      .select("amount, due_date")
      .neq("expense_type", "fixed")
      .neq("expense_type", "installment")
      .gt("due_date", currentRange.endISO)
      .lte("due_date", projectionEndISO),
    supabase.from("installments").select("*").eq("status", "open"),
    supabase.from("profiles").select("user_id, name"),
  ]);

  function monthSummary(incomes: Income[], expenses: Expense[], installments: Installment[]) {
    const received = receivedIncome(incomes);
    const expected = expectedIncome(incomes);
    const paid = paidExpense(expenses, installments);
    const open = openExpense(expenses, installments);
    return { received, expected, paid, open, balance: currentBalance(received, paid) };
  }

  const currentSummary = monthSummary(incomesCurrent ?? [], expensesCurrent ?? [], installmentsCurrent ?? []);
  const previousSummary = monthSummary(incomesPrevious ?? [], (expensesPrevious ?? []) as Expense[], installmentsPrevious ?? []);

  const memberByUserId = new Map((members ?? []).map((m) => [m.user_id, m.name]));

  const categoryTotals = new Map<string, number>();
  const personTotals = new Map<string, number>();
  for (const expense of (expensesCurrent ?? []) as (Expense & { category: { name: string } | null })[]) {
    const categoryName = expense.category?.name ?? "Outros";
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + expense.amount);
    const personName = memberByUserId.get(expense.user_id) ?? "Outro";
    personTotals.set(personName, (personTotals.get(personName) ?? 0) + expense.amount);
  }
  const categoryData = Array.from(categoryTotals.entries()).map(([name, value]) => ({ name, value }));
  const personData = Array.from(personTotals.entries()).map(([name, value]) => ({ name, value }));

  const incomeByMonth = new Map<string, number>();
  for (const income of incomesHistory ?? []) {
    if (income.status !== "received") continue;
    const key = income.expected_date.slice(0, 7);
    incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + income.amount);
  }
  const expenseByMonth = new Map<string, number>();
  for (const expense of expensesHistory ?? []) {
    if (expense.status !== "paid") continue;
    const key = expense.due_date.slice(0, 7);
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + expense.amount);
  }
  for (const installment of installmentsHistory ?? []) {
    if (installment.status !== "paid") continue;
    const key = installment.due_date.slice(0, 7);
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + installment.amount);
  }
  const monthsWithData = new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()]).size || 1;
  const averageIncome = Array.from(incomeByMonth.values()).reduce((a, b) => a + b, 0) / monthsWithData;
  const averageExpense = Array.from(expenseByMonth.values()).reduce((a, b) => a + b, 0) / monthsWithData;

  const projection = projectFutureMonths({
    fixedIncomes: fixedIncomes ?? [],
    fixedExpenses: fixedExpenses ?? [],
    futureIncomes: futureIncomes ?? [],
    futureExpenses: futureExpenses ?? [],
    installments: (openInstallments ?? []) as Installment[],
    monthsAhead: 12,
    startDate: now,
  });
  const firstRiskMonth = projection.find((month) => month.isNegative);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Relatórios</h1>
        <p className="text-sm text-text-secondary">Comparativos, médias e projeções financeiras da família.</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          {MONTH_NAMES[now.getMonth()]} vs {MONTH_NAMES[previous.getMonth()]}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={`Recebido em ${MONTH_NAMES[now.getMonth()].slice(0, 3)}`} value={currentSummary.received} tone="positive" />
          <StatCard label={`Recebido em ${MONTH_NAMES[previous.getMonth()].slice(0, 3)}`} value={previousSummary.received} tone="neutral" />
          <StatCard label={`Pago em ${MONTH_NAMES[now.getMonth()].slice(0, 3)}`} value={currentSummary.paid} tone="negative" />
          <StatCard label={`Pago em ${MONTH_NAMES[previous.getMonth()].slice(0, 3)}`} value={previousSummary.paid} tone="neutral" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Gastos por categoria" subtitle="Mês atual">
          <CategoryPieChart data={categoryData} />
        </ChartCard>
        <ChartCard title="Gastos por pessoa" subtitle="Mês atual">
          <PersonBarChart data={personData} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label="Média mensal de entradas" value={averageIncome} tone="positive" hint="Últimos 6 meses" />
        <StatCard label="Média mensal de gastos" value={averageExpense} tone="negative" hint="Últimos 6 meses" />
      </div>

      {firstRiskMonth ? (
        <div className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-4 text-sm text-negative">
          Atenção: a projeção indica saldo negativo em <strong>{firstRiskMonth.label}</strong>.
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-green-200 bg-green-50 p-4 text-sm text-positive">
          Nenhum mês com risco de saldo negativo nos próximos 12 meses.
        </div>
      )}

      <RelatoriosClient projection={projection} />
    </div>
  );
}
