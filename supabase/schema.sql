-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for floor plan projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  image_url text,
  processed_data jsonb, -- This will hold the AI extracted rooms, walls, etc.
  status text default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table projects enable row level security;

-- Profiles: Users can view their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Projects: Users can view and manage their own projects
create policy "Users can view own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- Storage bucket for floor plan images
-- Note: Buckets need to be created in the Supabase UI, but policies can be defined here if public.
-- insert into storage.buckets (id, name, public) values ('floor-plans', 'floor-plans', false);

-- Storage Policy: Users can upload and access their own floor plans
-- These policies usually target storage.objects
