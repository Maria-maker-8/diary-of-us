-- Diary of Us – run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates tables and RLS so two users can share one journal.

-- Journals: one per couple. Owner creates it; partner joins with invite code.
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- Who belongs to which journal (max 2 for now: you + partner).
create table if not exists public.journal_members (
  journal_id uuid not null references public.journals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (journal_id, user_id)
);

-- Pages: title, emoji, rich text content (HTML from TipTap).
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  slug text not null,
  emoji text not null default '📝',
  title text not null,
  hint text,
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(journal_id, slug)
);

-- Widgets: dashboard layout and config per journal.
create table if not exists public.widgets (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  widget_key text not null,
  config jsonb not null default '{}',
  position int not null default 0,
  unique(journal_id, widget_key)
);

-- Helper: journals the current user can access.
create or replace function public.user_journal_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select journal_id from public.journal_members where user_id = auth.uid();
$$;

-- RLS
alter table public.journals enable row level security;
alter table public.journal_members enable row level security;
alter table public.pages enable row level security;
alter table public.widgets enable row level security;

-- Journals: visible only to members
create policy "Users see own journals"
  on public.journals for select
  using (id in (select public.user_journal_ids()));

create policy "Users can insert journal when they are the first (no members yet for this journal)"
  on public.journals for insert
  with check (true);

-- Members: visible only to members of that journal
create policy "Members see journal_members"
  on public.journal_members for select
  using (journal_id in (select public.user_journal_ids()));

create policy "Users can join journal with invite code"
  on public.journal_members for insert
  with check (user_id = auth.uid());

-- Pages: CRUD for journal members
create policy "Members can read pages"
  on public.pages for select
  using (journal_id in (select public.user_journal_ids()));

create policy "Members can insert pages"
  on public.pages for insert
  with check (journal_id in (select public.user_journal_ids()));

create policy "Members can update pages"
  on public.pages for update
  using (journal_id in (select public.user_journal_ids()));

create policy "Members can delete pages"
  on public.pages for delete
  using (journal_id in (select public.user_journal_ids()));

-- Widgets: same as pages
create policy "Members can read widgets"
  on public.widgets for select
  using (journal_id in (select public.user_journal_ids()));

create policy "Members can insert widgets"
  on public.widgets for insert
  with check (journal_id in (select public.user_journal_ids()));

create policy "Members can update widgets"
  on public.widgets for update
  using (journal_id in (select public.user_journal_ids()));

create policy "Members can delete widgets"
  on public.widgets for delete
  using (journal_id in (select public.user_journal_ids()));

-- Updated_at trigger for pages
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pages_updated_at on public.pages;
create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();
