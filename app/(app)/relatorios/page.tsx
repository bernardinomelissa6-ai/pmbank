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
import { PersonFilter } from "@/components/dashboard/PersonFilter";
import type { Expense, Income, Installment } from "@/types/database";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;
  const person = params.person || "all";

  const now = new Date();
  const previous = addMonths(now, -1);
  const currentRange = monthRange(now.getMonth() + 1, now.getFullYear());
  const previousRange = monthRange(previous.getMonth() + 1, previous.getFullYear());

  const historyStart = addMonths(now, -5);
  const historyStartISO = monthRange(historyStart.getMonth() + 1, historyStart.getFullYear()).startISO;

  const projectionEnd = addMonths(now, 12);
  const projectionEndISO = monthRange(projectionEnd.getMonth() + 1, projectionEnd.getFullYear()).endISO;

  let incomesCurrentQuery = supabase.from("incomes").select("*").gte("expected_date", currentRange.startISO).lte("expected_date", currentRange.endISO);
  let expensesCurrentQuery = supabase
    .from("expenses")
    .select("*, category:categories(name)")
    .neq("expense_type", "installment")
    .gte("due_date", currentRange.startISO)
    .lte("due_date", currentRange.endISO);
  let installmentsCurrentQuery = supabase.from("installments").select("*").gte("due_date", currentRange.startISO).lte("due_date", currentRange.endISO);
  let incomesPreviousQuery = supabase.from("incomes").select("*").gte("expected_date", previousRange.startISO).lte("expected_date", previousRange.endISO);
  let expensesPreviousQuery = supabase
    .from("expenses")
    .select("*")
    .neq("expense_type", "installment")
    .gte("due_date", previousRange.startISO)
    .lte("due_date", previousRange.endISO);
  let installmentsPreviousQuery = supabase.from("installments").select("*").gte("due_date", previousRange.startISO).lte("due_date", previousRange.endISO);
  let incomesHistoryQuery = supabase
    .from("incomes")
    .select("amount, status, expected_date")
    .gte("expected_date", historyStartISO)
    .lte("expected_date", currentRange.endISO);
  let expensesHistoryQuery = supabase
    .from("expenses")
    .select("amount, status, due_date")
    .neq("expense_type", "installment")
    .gte("due_date", historyStartISO)
    .lte("due_date", currentRange.endISO);
  let installmentsHistoryQuery = supabase.from("installments").select("amount, status, due_date").gte("due_date", historyStartISO).lte("due_date", currentRange.endISO);
  let fixedIncomesQuery = supabase
    .from("incomes")
    .select("*")
    .eq("income_type", "fixed")
    .gte("expected_date", currentRange.startISO)
    .lte("expected_date", currentRange.endISO);
  let fixedExpensesQuery = supabase
    .from("expenses")
    .select("*")
    .eq("expense_type", "fixed")
    .gte("due_date", currentRange.startISO)
    .lte("due_date", currentRange.endISO);
  let futureIncomesQuery = supabase
    .from("incomes")
    .select("amount, expected_date")
    .neq("income_type", "fixed")
    .gt("expected_date", currentRange.endISO)
    .lte("expected_date", projectionEndISO);
  let futureExpensesQuery = supabase
    .from("expenses")
    .select("amount, due_date")
    .neq("expense_type", "fixed")
    .neq("expense_type", "installment")
    .gt("due_date", currentRange.endISO)
    .lte("due_date", projectionEndISO);
  let openInstallmentsQuery = supabase.from("installments").select("*").eq("status", "open");

  if (person !== "all") {
    incomesCurrentQuery = incomesCurrentQuery.eq("user_id", person);
    expensesCurrentQuery = expensesCurrentQuery.eq("user_id", person);
    installmentsCurrentQuery = installmentsCurrentQuery.eq("user_id", person);
    incomesPreviousQuery = incomesPreviousQuery.eq("user_id", person);
    expensesPreviousQuery = expensesPreviousQuery.eq("user_id", person);
    installmentsPreviousQuery = installmentsPreviousQuery.eq("user_id", person);
    incomesHistoryQuery = incomesHistoryQuery.eq("user_id", person);
    expensesHistoryQuery = expensesHistoryQuery.eq("user_id", person);
    installmentsHistoryQuery = installmentsHistoryQuery.eq("user_id", person);
    fixedIncomesQuery = fixedIncomesQuery.eq("user_id", person);
    fixedExpensesQuery = fixedExpensesQuery.eq("user_id", person);
    futureIncomesQuery = futureIncomesQuery.eq("user_id", person);
    futureExpensesQuery = futureExpensesQuery.eq("user_id", person);
    openInstallmentsQuery = openInstallmentsQuery.eq("user_id", person);
  }

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
    incomesCurrentQuery,
    expensesCurrentQuery,
    installmentsCurrentQuery,
    incomesPreviousQuery,
    expensesPreviousQuery,
    installmentsPreviousQuery,
    incomesHistoryQuery,
    expensesHistoryQuery,
    installmentsHistoryQuery,
    fixedIncomesQuery,
    fixedExpensesQuery,
    futureIncomesQuery,
    futureExpensesQuery,
    openInstallmentsQuery,
    supabase.from("profiles").select("user_id, name, status"),
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
  for (const expense of (expensesCurrent ?? []) as (Expense & { category: { name: string } | null })[]) {
    const categoryName = expense.category?.name ?? "Outros";
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + expense.amount);
  }
  const categoryData = Array.from(categoryTotals.entries()).map(([name, value]) => ({ name, value }));

  const personStats = new Map<string, { name: string; spent: number; pending: number; received: number }>();
  function personEntry(id: string) {
    let entry = personStats.get(id);
    if (!entry) {
      entry = { name: memberByUserId.get(id) ?? "Outro", spent: 0, pending: 0, received: 0 };
      personStats.set(id, entry);
    }
    return entry;
  }
  for (const expense of (expensesCurrent ?? []) as Expense[]) {
    const entry = personEntry(expense.user_id);
    if (expense.status === "paid") entry.spent += expense.amount;
    else if (expense.status === "open" || expense.status === "late") entry.pending += expense.amount;
  }
  for (const installment of (installmentsCurrent ?? []) as Installment[]) {
    const entry = personEntry(installment.user_id);
    if (installment.status === "paid") entry.spent += installment.amount;
    else if (installment.status === "open" || installment.status === "late") entry.pending += installment.amount;
  }
  for (const income of (incomesCurrent ?? []) as Income[]) {
    if (income.status !== "received") continue;
    personEntry(income.user_id).received += income.amount;
  }
  const personData = Array.from(personStats.entries()).map(([id, { name, spent, pending, received }]) => ({
    id,
    name,
    spent,
    pending,
    remaining: received - spent,
  }));

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Relatórios</h1>
          <p className="text-sm text-text-secondary">Comparativos, médias e projeções financeiras da família.</p>
        </div>
        <PersonFilter
          person={person}
          options={(members ?? [])
            .filter((m) => m.status === "active")
            .map((m) => ({ value: m.user_id, label: m.name }))}
        />
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
        <div className="rounded-[var(--radius-card)] border border-negative/30 bg-negative/10 p-4 text-sm text-negative">
          Atenção: a projeção indica saldo negativo em <strong>{firstRiskMonth.label}</strong>.
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-positive/30 bg-positive/10 p-4 text-sm text-positive">
          Nenhum mês com risco de saldo negativo nos próximos 12 meses.
        </div>
      )}

      <RelatoriosClient projection={projection} />
    </div>
  );
}
