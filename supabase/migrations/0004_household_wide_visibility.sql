-- CasaFlow — visibilidade total dentro do household: qualquer membro pode VER os
-- lançamentos de qualquer outro membro (entradas, gastos, parcelas, metas, regras de
-- recorrência). Edição/exclusão continua restrita ao dono do registro (ou admin) —
-- essas policies (insert/update/delete) não mudam aqui, só as de SELECT.
-- Rodar no SQL Editor do Supabase depois de 0001, 0002 e 0003 já aplicados.

drop policy "incomes_select" on public.incomes;
create policy "incomes_select" on public.incomes
  for select using (household_id = public.current_household_id());

drop policy "expenses_select" on public.expenses;
create policy "expenses_select" on public.expenses
  for select using (household_id = public.current_household_id());

drop policy "installments_select" on public.installments;
create policy "installments_select" on public.installments
  for select using (household_id = public.current_household_id());

drop policy "goals_select" on public.financial_goals;
create policy "goals_select" on public.financial_goals
  for select using (household_id = public.current_household_id());

drop policy "income_recurrences_select" on public.income_recurrences;
create policy "income_recurrences_select" on public.income_recurrences
  for select using (household_id = public.current_household_id());
