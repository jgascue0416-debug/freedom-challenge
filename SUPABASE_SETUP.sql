-- Run this entire block in the Supabase SQL Editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  is_challenge boolean default false,
  is_leader boolean default false,
  current_day integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  day_number integer not null,
  mood text,
  note text default '',
  complete boolean default false,
  temptation boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, day_number)
);

-- Allow users to read/write their own data
alter table profiles enable row level security;
alter table checkins enable row level security;

create policy "Users can read all profiles" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can read all checkins" on checkins for select using (true);
create policy "Users can insert own checkins" on checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own checkins" on checkins for update using (auth.uid() = user_id);
