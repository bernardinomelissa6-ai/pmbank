// Tipos manuais alinhados a supabase/migrations/0001_init.sql.
// Podem ser substituídos por `supabase gen types typescript` quando o CLI estiver disponível.

export type Role = "admin" | "member";
export type ProfileStatus = "active" | "inactive";
export type CategoryType = "income" | "expense";
export type AccountType = "bank" | "wallet" | "cash" | "pix" | "joint";
export type IncomeType = "fixed" | "variable" | "recurring";
export type IncomeStatus = "expected" | "received" | "late";
export type ExpenseType = "fixed" | "variable" | "recurring" | "installment";
export type ExpenseStatus = "open" | "paid" | "late" | "cancelled";
export type PaymentMethod = "pix" | "debit" | "credit" | "cash" | "transfer" | "boleto" | "other";
export type GoalStatus = "active" | "completed" | "paused" | "cancelled";
export type RecurrenceFrequency = "monthly" | "biweekly" | "weekly" | "yearly" | "custom";
export type RecurrenceStatus = "active" | "cancelled";

export interface Household {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  household_id: string;
  name: string;
  email: string;
  role: Role;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  household_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  created_by: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  household_id: string;
  account_id: string | null;
  name: string;
  limit_amount: number | null;
  closing_day: number | null;
  due_day: number | null;
  current_invoice_amount: number;
  created_by: string | null;
  created_at: string;
}

export interface Income {
  id: string;
  household_id: string;
  user_id: string;
  category_id: string | null;
  account_id: string | null;
  description: string;
  amount: number;
  income_type: IncomeType;
  expected_date: string;
  received_date: string | null;
  status: IncomeStatus;
  is_shared: boolean;
  recurrence_rule: string | null;
  recurrence_group_id: string | null;
  recurrence_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeRecurrence {
  id: string;
  household_id: string;
  user_id: string;
  description: string;
  category_id: string | null;
  account_id: string | null;
  amount: number;
  frequency: RecurrenceFrequency;
  custom_interval_days: number | null;
  start_date: string;
  end_date: string | null;
  generated_until: string;
  notes: string | null;
  is_shared: boolean;
  status: RecurrenceStatus;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  user_id: string;
  category_id: string | null;
  account_id: string | null;
  card_id: string | null;
  description: string;
  amount: number;
  expense_type: ExpenseType;
  due_date: string;
  paid_date: string | null;
  status: ExpenseStatus;
  payment_method: PaymentMethod | null;
  is_shared: boolean;
  recurrence_rule: string | null;
  recurrence_group_id: string | null;
  recurrence_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  household_id: string;
  parent_expense_id: string;
  user_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: ExpenseStatus;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  household_id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: GoalStatus;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlySummary {
  id: string;
  household_id: string;
  user_id: string | null;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  projected_balance: number;
  real_balance: number;
  created_at: string;
  updated_at: string;
}

// Views compostas usadas na UI (join simples feito no server component)
export interface IncomeWithRelations extends Income {
  category: Pick<Category, "id" | "name" | "color" | "icon"> | null;
  account: Pick<Account, "id" | "name"> | null;
  owner: Pick<Profile, "id" | "name"> | null;
}

export interface ExpenseWithRelations extends Expense {
  category: Pick<Category, "id" | "name" | "color" | "icon"> | null;
  account: Pick<Account, "id" | "name"> | null;
  card: Pick<Card, "id" | "name"> | null;
  owner: Pick<Profile, "id" | "name"> | null;
}
