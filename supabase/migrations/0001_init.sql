-- CasaFlow — schema inicial, funções auxiliares e RLS
-- Rodar no SQL Editor do Supabase (ou via `supabase db push`) em um projeto novo.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABELAS
-- ============================================================================

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text,
  icon text,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'wallet', 'cash', 'pix', 'joint')),
  initial_balance numeric not null default 0,
  current_balance numeric not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  name text not null,
  limit_amount numeric,
  closing_day int,
  due_day int,
  current_invoice_amount numeric not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  description text not null,
  amount numeric not null,
  income_type text not null check (income_type in ('fixed', 'variable', 'recurring')),
  expected_date date not null,
  received_date date,
  status text not null default 'expected' check (status in ('expected', 'received', 'late')),
  is_shared boolean not null default false,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  description text not null,
  amount numeric not null,
  expense_type text not null check (expense_type in ('fixed', 'variable', 'recurring', 'installment')),
  due_date date not null,
  paid_date date,
  status text not null default 'open' check (status in ('open', 'paid', 'late', 'cancelled')),
  payment_method text check (payment_method in ('pix', 'debit', 'credit', 'cash', 'transfer', 'boleto', 'other')),
  is_shared boolean not null default false,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.installments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  installment_number int not null,
  total_installments int not null,
  amount numeric not null,
  due_date date not null,
  paid_date date,
  status text not null default 'open' check (status in ('open', 'paid', 'late', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  total_income numeric not null default 0,
  total_expense numeric not null default 0,
  projected_balance numeric not null default 0,
  real_balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

create index idx_profiles_household on public.profiles(household_id);
create index idx_profiles_user on public.profiles(user_id);
create index idx_categories_household on public.categories(household_id);
create index idx_accounts_household on public.accounts(household_id);
create index idx_cards_household on public.cards(household_id);
create index idx_cards_account on public.cards(account_id);
create index idx_incomes_household on public.incomes(household_id);
create index idx_incomes_user on public.incomes(user_id);
create index idx_incomes_expected_date on public.incomes(expected_date);
create index idx_incomes_status on public.incomes(status);
create index idx_expenses_household on public.expenses(household_id);
create index idx_expenses_user on public.expenses(user_id);
create index idx_expenses_due_date on public.expenses(due_date);
create index idx_expenses_status on public.expenses(status);
create index idx_expenses_card on public.expenses(card_id);
create index idx_installments_household on public.installments(household_id);
create index idx_installments_parent on public.installments(parent_expense_id);
create index idx_installments_due_date on public.installments(due_date);
create index idx_goals_household on public.financial_goals(household_id);
create index idx_summaries_household on public.monthly_summaries(household_id);
create unique index idx_summaries_unique on public.monthly_summaries(household_id, user_id, month, year);

-- ============================================================================
-- FUNÇÕES AUXILIARES (SECURITY DEFINER — evitam recursão de RLS em profiles)
-- ============================================================================

create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- Público (sem autenticação) — usado em /login e /setup para decidir o fluxo de cadastro.
create or replace function public.system_has_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where role = 'admin');
$$;

grant execute on function public.current_household_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.system_has_admin() to anon, authenticated;

-- Seed de categorias padrão de um household. Chamada apenas pelas Server Actions
-- (client service_role) durante /setup e ao criar o primeiro household.
create or replace function public.create_default_categories(p_household_id uuid, p_created_by uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, name, type, color, icon, is_default, created_by) values
    (p_household_id, 'Moradia',          'expense', '#2563EB', 'home',          true, p_created_by),
    (p_household_id, 'Alimentação',      'expense', '#F97316', 'utensils',      true, p_created_by),
    (p_household_id, 'Mercado',          'expense', '#16A34A', 'shopping-cart', true, p_created_by),
    (p_household_id, 'Transporte',       'expense', '#0EA5E9', 'car',           true, p_created_by),
    (p_household_id, 'Cartão de crédito','expense', '#DC2626', 'credit-card',   true, p_created_by),
    (p_household_id, 'Saúde',            'expense', '#14B8A6', 'heart-pulse',   true, p_created_by),
    (p_household_id, 'Lazer',            'expense', '#A855F7', 'party-popper',  true, p_created_by),
    (p_household_id, 'Investimentos',    'expense', '#533AFD', 'trending-up',   true, p_created_by),
    (p_household_id, 'Dívidas',          'expense', '#B91C1C', 'file-warning',  true, p_created_by),
    (p_household_id, 'Assinaturas',      'expense', '#EA580C', 'repeat',        true, p_created_by),
    (p_household_id, 'Emergências',      'expense', '#DC2626', 'siren',         true, p_created_by),
    (p_household_id, 'Outros',           'expense', '#64748B', 'more-horizontal',true, p_created_by),
    (p_household_id, 'Salário',          'income',  '#16A34A', 'wallet',        true, p_created_by),
    (p_household_id, 'Extra',            'income',  '#22C55E', 'plus-circle',   true, p_created_by),
    (p_household_id, 'Comissão',         'income',  '#0EA5E9', 'percent',       true, p_created_by),
    (p_household_id, 'Reembolso',        'income',  '#14B8A6', 'rotate-ccw',    true, p_created_by),
    (p_household_id, 'Investimento',     'income',  '#533AFD', 'trending-up',   true, p_created_by),
    (p_household_id, 'Presente',         'income',  '#A855F7', 'gift',          true, p_created_by),
    (p_household_id, 'Outros',           'income',  '#64748B', 'more-horizontal',true, p_created_by);
end;
$$;

revoke all on function public.create_default_categories(uuid, uuid) from public, authenticated, anon;
grant execute on function public.create_default_categories(uuid, uuid) to service_role;

-- ============================================================================
-- updated_at automático
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_households_updated_at before update on public.households
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_incomes_updated_at before update on public.incomes
  for each row execute function public.set_updated_at();
create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger trg_goals_updated_at before update on public.financial_goals
  for each row execute function public.set_updated_at();
create trigger trg_summaries_updated_at before update on public.monthly_summaries
  for each row execute function public.set_updated_at();

-- Impede que um usuário não-admin altere role/status/household_id do próprio perfil
-- (chamadas via service_role, sem auth.uid(), não são afetadas — o backend já valida admin antes).
create or replace function public.profiles_guard_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.household_id := old.household_id;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard_privileged_fields();

-- Ajustes de saldo/fatura disparados por qualquer membro do household (ex.: marcar uma
-- entrada como recebida ou um gasto como pago), mesmo que accounts/cards só possam ser
-- editados (metadados) por admin via RLS normal. O escopo por household_id é reforçado
-- dentro da função, então isso não permite alterar dados de outro household.
create or replace function public.increment_account_balance(p_account_id uuid, p_delta numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.accounts
  set current_balance = current_balance + p_delta
  where id = p_account_id and household_id = public.current_household_id();
end;
$$;

create or replace function public.increment_card_invoice(p_card_id uuid, p_delta numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cards
  set current_invoice_amount = current_invoice_amount + p_delta
  where id = p_card_id and household_id = public.current_household_id();
end;
$$;

grant execute on function public.increment_account_balance(uuid, numeric) to authenticated;
grant execute on function public.increment_card_invoice(uuid, numeric) to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.cards enable row level security;
alter table public.incomes enable row level security;
alter table public.expenses enable row level security;
alter table public.installments enable row level security;
alter table public.financial_goals enable row level security;
alter table public.monthly_summaries enable row level security;

-- households: sem policy de insert/delete para authenticated (só service_role, que ignora RLS).
create policy "households_select_own" on public.households
  for select using (id = public.current_household_id());
create policy "households_update_admin" on public.households
  for update using (id = public.current_household_id() and public.is_admin());

-- profiles
create policy "profiles_select_household" on public.profiles
  for select using (user_id = auth.uid() or household_id = public.current_household_id());
create policy "profiles_update_self_or_admin" on public.profiles
  for update
  using (user_id = auth.uid() or (public.is_admin() and household_id = public.current_household_id()))
  with check (household_id = public.current_household_id());

-- categories (somente admin gerencia; todo household pode ver)
create policy "categories_select_household" on public.categories
  for select using (household_id = public.current_household_id());
create policy "categories_insert_admin" on public.categories
  for insert with check (household_id = public.current_household_id() and public.is_admin());
create policy "categories_update_admin" on public.categories
  for update using (household_id = public.current_household_id() and public.is_admin());
create policy "categories_delete_admin" on public.categories
  for delete using (household_id = public.current_household_id() and public.is_admin());

-- accounts (somente admin gerencia; todo household pode ver, para lançar entradas/gastos)
create policy "accounts_select_household" on public.accounts
  for select using (household_id = public.current_household_id());
create policy "accounts_insert_admin" on public.accounts
  for insert with check (household_id = public.current_household_id() and public.is_admin());
create policy "accounts_update_admin" on public.accounts
  for update using (household_id = public.current_household_id() and public.is_admin());
create policy "accounts_delete_admin" on public.accounts
  for delete using (household_id = public.current_household_id() and public.is_admin());

-- cards (somente admin gerencia; todo household pode ver)
create policy "cards_select_household" on public.cards
  for select using (household_id = public.current_household_id());
create policy "cards_insert_admin" on public.cards
  for insert with check (household_id = public.current_household_id() and public.is_admin());
create policy "cards_update_admin" on public.cards
  for update using (household_id = public.current_household_id() and public.is_admin());
create policy "cards_delete_admin" on public.cards
  for delete using (household_id = public.current_household_id() and public.is_admin());

-- incomes: admin vê tudo; member vê o que é seu ou compartilhado. Cada um só cria/edita o que é seu (admin edita tudo).
create policy "incomes_select" on public.incomes
  for select using (
    household_id = public.current_household_id()
    and (public.is_admin() or user_id = auth.uid() or is_shared = true)
  );
create policy "incomes_insert_self" on public.incomes
  for insert with check (household_id = public.current_household_id() and user_id = auth.uid());
create policy "incomes_update" on public.incomes
  for update using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "incomes_delete" on public.incomes
  for delete using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));

-- expenses: mesmo padrão de incomes
create policy "expenses_select" on public.expenses
  for select using (
    household_id = public.current_household_id()
    and (public.is_admin() or user_id = auth.uid() or is_shared = true)
  );
create policy "expenses_insert_self" on public.expenses
  for insert with check (household_id = public.current_household_id() and user_id = auth.uid());
create policy "expenses_update" on public.expenses
  for update using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "expenses_delete" on public.expenses
  for delete using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));

-- installments: seguem a visibilidade do expense pai (próprio, admin, ou compartilhado)
create policy "installments_select" on public.installments
  for select using (
    household_id = public.current_household_id()
    and (
      public.is_admin() or user_id = auth.uid()
      or exists (
        select 1 from public.expenses e
        where e.id = installments.parent_expense_id and e.is_shared = true
      )
    )
  );
create policy "installments_insert_self" on public.installments
  for insert with check (household_id = public.current_household_id() and user_id = auth.uid());
create policy "installments_update" on public.installments
  for update using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "installments_delete" on public.installments
  for delete using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));

-- financial_goals
create policy "goals_select" on public.financial_goals
  for select using (
    household_id = public.current_household_id()
    and (public.is_admin() or user_id = auth.uid() or is_shared = true)
  );
create policy "goals_insert_self" on public.financial_goals
  for insert with check (household_id = public.current_household_id() and user_id = auth.uid());
create policy "goals_update" on public.financial_goals
  for update using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "goals_delete" on public.financial_goals
  for delete using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));

-- monthly_summaries (cache de leitura; escrita normalmente via job/admin)
create policy "summaries_select" on public.monthly_summaries
  for select using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "summaries_insert" on public.monthly_summaries
  for insert with check (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "summaries_update" on public.monthly_summaries
  for update using (household_id = public.current_household_id() and (public.is_admin() or user_id = auth.uid()));
create policy "summaries_delete" on public.monthly_summaries
  for delete using (household_id = public.current_household_id() and public.is_admin());
