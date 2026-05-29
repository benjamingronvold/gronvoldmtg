-- PROFILES (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_username text,
  display_name text,
  role text not null default 'bruker',
  created_at timestamptz default now()
);

-- Trigger: auto-create profile on first Discord login
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, discord_username, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'custom_claims'->>'global_name',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- MATCHES
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  opponent_archetype text not null,
  result text not null check (result in ('2-0','2-1','1-2','0-2')),
  match_win boolean generated always as (result in ('2-0','2-1')) stored,
  game_wins integer generated always as (split_part(result,'-',1)::integer) stored,
  game_losses integer generated always as (split_part(result,'-',2)::integer) stored,
  notes text,
  played_at date not null default current_date,
  created_at timestamptz default now()
);

-- TOURNAMENTS
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- TOURNAMENT PLAYERS
create table if not exists tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  display_name text not null,
  moxfield_username text,
  mtgo_username text,
  archetype text,
  decklist_url text,
  scraped_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table matches enable row level security;
alter table tournaments enable row level security;
alter table tournament_players enable row level security;

-- Profiles
create policy "read profiles"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "own profile update"
  on profiles for update
  using (auth.uid() = id);

-- Matches: users own their own
create policy "own matches select"
  on matches for select
  using (auth.uid() = user_id);

create policy "own matches insert"
  on matches for insert
  with check (auth.uid() = user_id);

create policy "own matches update"
  on matches for update
  using (auth.uid() = user_id);

create policy "own matches delete"
  on matches for delete
  using (auth.uid() = user_id);

-- Tournaments: all authed can read; admin/teammedlem/superadmin can write
create policy "read tournaments"
  on tournaments for select
  using (auth.role() = 'authenticated');

create policy "create tournaments"
  on tournaments for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin','teammedlem','superadmin')
    )
  );

create policy "delete tournaments"
  on tournaments for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin','superadmin')
    )
  );

-- Tournament players
create policy "read tournament_players"
  on tournament_players for select
  using (auth.role() = 'authenticated');

create policy "manage tournament_players"
  on tournament_players for all
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
