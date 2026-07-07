-- CasaFlow — suporte a recorrência com data final (gera 1 lançamento por mês,
-- cada um independente, agrupados por recurrence_group_id).
-- Rodar no SQL Editor do Supabase depois de 0001_init.sql já aplicado.

alter table public.incomes
  add column recurrence_group_id uuid,
  add column recurrence_end_date date;

alter table public.expenses
  add column recurrence_group_id uuid,
  add column recurrence_end_date date;

create index idx_incomes_recurrence_group on public.incomes(recurrence_group_id);
create index idx_expenses_recurrence_group on public.expenses(recurrence_group_id);
