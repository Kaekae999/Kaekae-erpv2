alter table public.companies enable row level security;

drop policy if exists "Allow All Companies" on public.companies;

create policy "Allow All Companies"
on public.companies
for all
to public
using (true)
with check (true);

alter table public.company_business_types enable row level security;

drop policy if exists "Allow All Company Business Types"
on public.company_business_types;

create policy "Allow All Company Business Types"
on public.company_business_types
for all
to public
using (true)
with check (true);