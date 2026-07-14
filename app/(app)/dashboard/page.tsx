import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { PersonBarChart } from "@/components/charts/PersonBarChart";
import { MonthlyEvolutionChart } from "@/components/charts/MonthlyEvolutionChart";
import { IncomeVsExpenseChart } from "@/components/charts/IncomeVsExpenseChart";
import { ConcentrationList } from "@/components/dashboard/ConcentrationList";
import { MonthNav } from "@/components/dashboard/MonthNav";
import { PersonFilter } from "@/components/dashboard/PersonFilter";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; person?: string }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;

  const today = new Date();
  const month = Number(params.month) || today.getMonth() + 1;
  const year = Number(params.year) || today.getFullYear();
  const selected = new Date(year, month - 1, 1);
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const person = params.person || "all";

  const { startISO, endISO } = monthRange(month, year);
  const historyStart = addMonths(selected, -5);
  const historyStartISO = monthRange(historyStart.getMonth() + 1, historyStart.getFullYear()).startISO;

  let incomesMonthQuery = supabase.from("incomes").select("*").gte("expected_date", startISO).lte("expected_date", endISO);
  let expensesMonthQuery = supabase
    .from("expenses")
    .select("*, category:categories(name)")
    .neq("expense_type", "installment")
    .gte("due_date", startISO)
    .lte("due_date", endISO);
  let installmentsMonthQuery = supabase
    .from("installments")
    .select("*, expense:expenses(card_id)")
    .gte("due_date", startISO)
    .lte("due_date", endISO);
  let incomesHistoryQuery = supabase
    .from("incomes")
    .select("amount, status, expected_date, user_id")
    .gte("expected_date", historyStartISO)
    .lte("expected_date", endISO);
  let expensesHistoryQuery = supabase
    .from("expenses")
    .select("amount, status, due_date, user_id")
    .neq("expense_type", "installment")
    .gte("due_date", historyStartISO)
    .lte("due_date", endISO);
  let installmentsHistoryQuery = supabase
    .from("installments")
    .select("amount, status, due_date, user_id")
    .gte("due_date", historyStartISO)
    .lte("due_date", endISO);

  if (person !== "all") {
    incomesMonthQuery = incomesMonthQuery.eq("user_id", person);
    expensesMonthQuery = expensesMonthQuery.eq("user_id", person);
    installmentsMonthQuery = installmentsMonthQuery.eq("user_id", person);
    incomesHistoryQuery = incomesHistoryQuery.eq("user_id", person);
    expensesHistoryQuery = expensesHistoryQuery.eq("user_id", person);
    installmentsHistoryQuery = installmentsHistoryQuery.eq("user_id", person);
  }

  const [
    { data: incomesMonth },
    { data: expensesMonth },
    { data: installmentsMonth },
    { data: incomesHistory },
    { data: expensesHistory },
    { data: installmentsHistory },
    { data: members },
    { data: cards },
  ] = await Promise.all([
    incomesMonthQuery,
    expensesMonthQuery,
    installmentsMonthQuery,
    incomesHistoryQuery,
    expensesHistoryQuery,
    installmentsHistoryQuery,
    supabase.from("profiles").select("user_id, name, status"),
    supabase.from("cards").select("id, name"),
  ]);

  const incomes = (incomesMonth ?? []) as Income[];
  const expenses = (expensesMonth ?? []) as (Expense & { category: { name: string } | null })[];
  const installments = (installmentsMonth ?? []) as (Installment & { expense: { card_id: string | null } | null })[];

  const received = receivedIncome(incomes);
  const expected = expectedIncome(incomes);
  const paid = paidExpense(expenses, installments);
  const open = openExpense(expenses, installments);
  const late = lateExpense(expenses, installments, todayISO());
  const balance = currentBalance(received, paid);
  const projected = projectedBalance(received, expected, paid, open);
  const dailyLimit = suggestedDailyLimit(projected, daysRemainingInMonth(today));

  const memberByUserId = new Map((members ?? []).map((m) => [m.user_id, m.name]));
  const cardNameById = new Map((cards ?? []).map((c) => [c.id, c.name]));

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0) + installments.reduce((sum, i) => sum + i.amount, 0);

  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    const name = expense.category?.name ?? "Outros";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + expense.amount);
  }
  const categoryData = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const personStats = new Map<string, { name: string; spent: number; pending: number; received: number }>();
  function personEntry(id: string) {
    let entry = personStats.get(id);
    if (!entry) {
      entry = { name: memberByUserId.get(id) ?? "Outro", spent: 0, pending: 0, received: 0 };
      personStats.set(id, entry);
    }
    return entry;
  }
  for (const expense of expenses) {
    const entry = personEntry(expense.user_id);
    if (expense.status === "paid") entry.spent += expense.amount;
    else if (expense.status === "open" || expense.status === "late") entry.pending += expense.amount;
  }
  for (const installment of installments) {
    const entry = personEntry(installment.user_id);
    if (installment.status === "paid") entry.spent += installment.amount;
    else if (installment.status === "open" || installment.status === "late") entry.pending += installment.amount;
  }
  for (const income of incomes) {
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

  const cardTotals = new Map<string, number>();
  for (const expense of expenses) {
    if (!expense.card_id) continue;
    const name = cardNameById.get(expense.card_id) ?? "Cartão";
    cardTotals.set(name, (cardTotals.get(name) ?? 0) + expense.amount);
  }
  for (const installment of installments) {
    const cardId = installment.expense?.card_id;
    if (!cardId) continue;
    const name = cardNameById.get(cardId) ?? "Cartão";
    cardTotals.set(name, (cardTotals.get(name) ?? 0) + installment.amount);
  }
  const cardData = Array.from(cardTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const totalCardSpend = cardData.reduce((sum, c) => sum + c.value, 0);

  const top3Categories = categoryData.slice(0, 3);
  const top3Share = totalExpenseAmount > 0 ? (top3Categories.reduce((sum, c) => sum + c.value, 0) / totalExpenseAmount) * 100 : 0;
  const topCategory = categoryData[0];
  const topCategoryShare = topCategory && totalExpenseAmount > 0 ? (topCategory.value / totalExpenseAmount) * 100 : 0;

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = addMonths(selected, -i);
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
    const [y, m] = key.split("-").map(Number);
    return `${MONTH_NAMES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Olá, {profile.name.split(" ")[0]}</h1>
          <p className="text-sm text-text-secondary">
            {isCurrentMonth ? `Resumo de ${MONTH_NAMES[month - 1]} · atualizado em ${formatDate(todayISO())}` : `Analisando ${MONTH_NAMES[month - 1]} de ${year}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PersonFilter
            person={person}
            options={(members ?? [])
              .filter((m) => m.status === "active")
              .map((m) => ({ value: m.user_id, label: m.name }))}
          />
          <MonthNav month={month} year={year} />
        </div>
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
        {isCurrentMonth ? (
          <StatCard label="Limite diário sugerido" value={dailyLimit} tone={dailyLimit >= 0 ? "positive" : "negative"} />
        ) : null}
      </div>

      {topCategory ? (
        <div
          className={
            topCategoryShare >= 40
              ? "rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
              : "rounded-[var(--radius-card)] border border-brand-blue/30 bg-brand-blue/10 p-4 text-sm text-brand-blue"
          }
        >
          {topCategoryShare >= 40 ? "Atenção: " : "Resumo: "}
          <strong>{topCategory.name}</strong> concentra {topCategoryShare.toFixed(0)}% dos gastos do mês
          {top3Categories.length > 1 ? (
            <> — as {top3Categories.length} maiores categorias juntas somam {top3Share.toFixed(0)}% do total.</>
          ) : (
            "."
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Gastos por categoria" subtitle="Mês atual">
          <CategoryPieChart data={categoryData} />
        </ChartCard>
        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Concentração de gastos</h3>
          <ConcentrationList items={categoryData.slice(0, 6)} total={totalExpenseAmount} />
        </div>
        <ChartCard title="Gastos por pessoa" subtitle="Mês atual">
          <PersonBarChart data={personData} />
        </ChartCard>
        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Gastos por cartão</h3>
          {cardData.length === 0 ? (
            <p className="text-sm text-text-secondary">Nenhum gasto em cartão neste mês.</p>
          ) : (
            <ConcentrationList items={cardData} total={totalCardSpend} />
          )}
        </div>
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
