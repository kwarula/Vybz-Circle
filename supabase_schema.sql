-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- RESET SCHEMA (WARNING: DELETES DATA)
drop table if exists public.tickets cascade;
drop table if exists public.events cascade;
drop table if exists public.users cascade;

-- USERS TABLE
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  phone varchar(15) unique,
  email varchar(255),
  display_name varchar(100),
  rep_points integer default 0,
  rep_level integer default 1,
  interests text[],
  home_location jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- EVENTS TABLE
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  title varchar(255) not null,
  slug varchar(255) unique,
  category varchar(50),
  venue_id uuid,
  location jsonb,
  starts_at timestamp with time zone,
  ticketing_type varchar(20),
  source varchar(20),
  status varchar(20) default 'draft',
  scout_count integer default 0,
  description text,
  image_url text,
  attendees integer default 0, -- Denormalized count for sorting
  is_going boolean default false, -- Mock field for specific user context, handled via joins generally but simplifying for now
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- TICKETS TABLE
create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id),
  user_id uuid references public.users(id),
  ticket_code varchar(20) unique,
  status varchar(20) default 'valid',
  checked_in_at timestamp with time zone,
  mpesa_receipt varchar(20),
  mpesa_checkout_id varchar(100),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS POLICIES (OPEN FOR MVP)
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.tickets enable row level security;

-- Allow public read/write for now to match MemStorage behavior
create policy "Allow public read access" on public.users for select using (true);
create policy "Allow public insert access" on public.users for insert with check (true);
create policy "Allow public update access" on public.users for update using (true);

create policy "Allow public read access" on public.events for select using (true);
create policy "Allow public insert access" on public.events for insert with check (true);
create policy "Allow public update access" on public.events for update using (true);

create policy "Allow public read access" on public.tickets for select using (true);
create policy "Allow public insert access" on public.tickets for insert with check (true);
create policy "Allow public update access" on public.tickets for update using (true);
