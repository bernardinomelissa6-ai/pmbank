import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { PersonBarChart } from "@/components/charts/PersonBarChart";
import { MonthlyEvolutionChart } from "@/components/charts/MonthlyEvolutionChart";
import { IncomeVsExpenseChart } from "@/components/charts/IncomeVsExpenseChart";
import {
  receivedIncome,
  expectedIncome,
  paidExpense,
  openExpense,
  lateExpense,
  currentBalance,
  projectedBalance,
  suggestedDailyLimit,
} from "@/lib/finance-calculations";
import { addMonths, daysRemainingInMonth, formatDate, monthRange, MONTH_NAMES, todayISO } from "@/lib/format";
import type { Expense, Income, Installment } from "@/types/database";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const now = new Date();
  const { startISO, endISO } = monthRange(now.getMonth() + 1, now.getFullYear());
  const historyStart = addMonths(now, -5);
  const historyStartISO = monthRange(historyStart.getMonth() + 1, historyStart.getFullYear()).startISO;

  const [
    { data: incomesMonth },
    { data: expensesMonth },
    { data: installmentsMonth },
    { data: incomesHistory },
    { data: expensesHistory },
    { data: installmentsHistory },
    { data: members },
  ] = await Promise.all([
    supabase.from("incomes").select("*").gte("expected_date", startISO).lte("expected_date", endISO),
    supabase
      .from("expenses")
      .select("*, category:categories(name)")
      .neq("expense_type", "installment")
      .gte("due_date", startISO)
      .lte("due_date", endISO),
    supabase.from("installments").select("*").gte("due_date", startISO).lte("due_date", endISO),
    supabase.from("incomes").select("amount, status, expected_date").gte("expected_date", historyStartISO).lte("expected_date", endISO),
    supabase
      .from("expenses")
      .select("amount, status, due_date")
      .neq("expense_type", "installment")
      .gte("due_date", historyStartISO)
      .lte("due_date", endISO),
    supabase.from("installments").select("amount, status, due_date").gte("due_date", historyStartISO).lte("due_date", endISO),
    supabase.from("profiles").select("user_id, name"),
  ]);

  const incomes = (incomesMonth ?? []) as Income[];
  const expenses = (expensesMonth ?? []) as (Expense & { category: { name: string } | null })[];
  const installments = (installmentsMonth ?? []) as Installment[];

  const received = receivedIncome(incomes);
  const expected = expectedIncome(incomes);
  const paid = paidExpense(expenses, installments);
  const open = openExpense(expenses, installments);
  const late = lateExpense(expenses, installments, todayISO());
  const balance = currentBalance(received, paid);
  const projected = projectedBalance(received, expected, paid, open);
  const dailyLimit = suggestedDailyLimit(projected, daysRemainingInMonth(now));

  const memberByUserId = new Map((members ?? []).map((m) => [m.user_id, m.name]));

  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    const name = expense.category?.name ?? "Outros";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + expense.amount);
  }
  const categoryData = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const personTotals = new Map<string, number>();
  for (const expense of expenses) {
    const name = memberByUserId.get(expense.user_id) ?? "Outro";
    personTotals.set(name, (personTotals.get(name) ?? 0) + expense.amount);
  }
  const personData = Array.from(personTotals.entries()).map(([name, value]) => ({ name, value }));

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = addMonths(now, -i);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

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

  const monthLabel = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return `${MONTH_NAMES[month - 1].slice(0, 3)}/${String(year).slice(2)}`;
  };

  const evolutionData = monthKeys.map((key) => ({
    label: monthLabel(key),
    balance: (incomeByMonth.get(key) ?? 0) - (expenseByMonth.get(key) ?? 0),
  }));

  const incomeVsExpenseData = monthKeys.map((key) => ({
    label: monthLabel(key),
    income: incomeByMonth.get(key) ?? 0,
    expense: expenseByMonth.get(key) ?? 0,
  }));

  const openCount = expenses.filter((e) => e.status === "open").length + installments.filter((i) => i.status === "open").length;
  const lateCount =
    expenses.filter((e) => e.status === "open" && e.due_date < todayISO()).length +
    installments.filter((i) => i.status === "open" && i.due_date < todayISO()).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Olá, {profile.name.split(" ")[0]}</h1>
        <p className="text-sm text-text-secondary">
          Resumo de {MONTH_NAMES[now.getMonth()]} · atualizado em {formatDate(todayISO())}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Entradas do mês" value={received + expected} tone="brand" />
        <StatCard label="Gastos do mês" value={paid + open} tone="brand" />
        <StatCard label="Saldo atual" value={balance} tone={balance >= 0 ? "positive" : "negative"} />
        <StatCard label="Saldo projetado" value={projected} tone={projected >= 0 ? "positive" : "negative"} />
        <StatCard label="Quanto falta receber" value={expected} tone="neutral" />
        <StatCard label="Quanto falta pagar" value={open} tone="neutral" />
        <StatCard label="Contas em aberto" value={openCount} isCurrency={false} tone="neutral" />
        <StatCard label="Contas atrasadas" value={lateCount} isCurrency={false} tone={lateCount > 0 ? "negative" : "neutral"} hint={late > 0 ? `${late.toLocaleString("pt-BR")}` : undefined} />
        <StatCard label="Limite diário sugerido" value={dailyLimit} tone={dailyLimit >= 0 ? "positive" : "negative"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Gastos por categoria" subtitle="Mês atual">
          <CategoryPieChart data={categoryData} />
        </ChartCard>
        <ChartCard title="Gastos por pessoa" subtitle="Mês atual">
          <PersonBarChart data={personData} />
        </ChartCard>
        <ChartCard title="Evolução mensal" subtitle="Saldo realizado — últimos 6 meses">
          <MonthlyEvolutionChart data={evolutionData} />
        </ChartCard>
        <ChartCard title="Entradas vs gastos" subtitle="Realizado — últimos 6 meses">
          <IncomeVsExpenseChart data={incomeVsExpenseData} />
        </ChartCard>
      </div>
    </div>
  );
}
