-- Personal deck database per user
create table if not exists user_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  format text default 'Modern',
  notes text,
  created_at timestamptz default now()
);

alter table user_decks enable row level security;

create policy "own decks select"
  on user_decks for select using (auth.uid() = user_id);

create policy "own decks insert"
  on user_decks for insert with check (auth.uid() = user_id);

create policy "own decks update"
  on user_decks for update using (auth.uid() = user_id);

create policy "own decks delete"
  on user_decks for delete using (auth.uid() = user_id);

-- Add my_deck column to existing matches table
alter table matches add column if not exists my_deck text;

-- Fix result check to allow draws (1-1-0)
alter table matches drop constraint if exists matches_result_check;
alter table matches add constraint matches_result_check
  check (result in ('2-0','2-1','1-2','0-2','1-1-0'));
