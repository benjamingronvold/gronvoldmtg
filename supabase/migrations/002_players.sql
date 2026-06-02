-- PLAYERS (persistent player database, reusable across tournaments)
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  moxfield_username text,
  mtgo_username text,
  archetype text,
  decklist_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_updated_at
  before update on players
  for each row execute procedure update_updated_at();

-- RLS
alter table players enable row level security;

create policy "read players"
  on players for select
  using (auth.role() = 'authenticated');

create policy "manage players"
  on players for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin','teammedlem','superadmin')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin','teammedlem','superadmin')
    )
  );
