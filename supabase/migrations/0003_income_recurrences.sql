-- CasaFlow — regras de recorrência de receitas (mensal/quinzenal/semanal/anual/personalizada,
-- com ou sem data final) + observações em incomes.
-- Rodar no SQL Editor do Supabase depois de 0001_init.sql e 0002_recurrence.sql já aplicados.

create table public.income_recurrences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  amount numeric not null,
  frequency text not null check (frequency in ('monthly', 'biweekly', 'weekly', 'yearly', 'custom')),
  custom_interval_days int,
  start_date date not null,
  end_date date,
  generated_until date not null,
  notes text,
  is_shared boolean not null default false,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_income_recurrences_household on public.income_recurrences(household_id);
create index idx_income_recurrences_user on public.income_recurrences(user_id);

create trigger trg_income_recurrences_updated_at before update on public.income_recurrences
  for each row execute function public.set_updated_at();

alter table public.incomes add column notes text;

alter table public.income_recurrences enable row level security;

create policy "income_recurrences_select" on public.income_recurrences
  for select using (
    household_id = public.current_household_id()
    and (public.is_admin() or user_id = auth.uid() or is_shared = true)
  );
create policy "income_recurrences_insert_self" on public.income_recurrences
  for insert with check (household_id = public.current_household_id() and user_id = auth.uid());
create policy "income_recurrences_update_self" on public.income_recurrences
  for update using (household_id = public.current_household_id() and user_id = auth.uid());
create policy "income_recurrences_delete_self" on public.income_recurrences
  for delete using (household_id = public.current_household_id() and user_id = auth.uid());
