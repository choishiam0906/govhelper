-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Companies table
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  business_number text,
  industry text,
  employee_count integer,
  founded_date date,
  location text,
  certifications text[],
  annual_revenue bigint,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Announcements table
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- 'narajangteo', 'bizinfo', 'kstartup', 'datagoKr'
  source_id text not null,
  title text not null,
  organization text,
  category text,
  support_type text,
  target_company text,
  support_amount text,
  application_start date,
  application_end date,
  content text,
  attachment_urls text[],
  parsed_content text,
  embedding vector(768),
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(source, source_id)
);

-- Business plans table
create table if not exists business_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  content text,
  file_url text,
  parsed_content text,
  embedding vector(768),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Matches table
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  announcement_id uuid references announcements(id) on delete cascade not null,
  business_plan_id uuid references business_plans(id) on delete set null,
  match_score integer not null,
  analysis jsonb,
  created_at timestamptz default now()
);

-- Applications table
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text,
  hwp_url text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payments table
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  payment_method text not null, -- 'toss', 'kakao', 'naver'
  payment_key text,
  order_id text not null unique,
  status text default 'pending',
  metadata jsonb,
  created_at timestamptz default now()
);

-- Subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan text default 'free', -- 'free', 'pro', 'enterprise'
  billing_key text,
  status text default 'active',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saved announcements (bookmarks)
create table if not exists saved_announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  announcement_id uuid references announcements(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, announcement_id)
);

-- Create indexes
create index if not exists idx_announcements_source on announcements(source);
create index if not exists idx_announcements_status on announcements(status);
create index if not exists idx_announcements_category on announcements(category);
create index if not exists idx_announcements_application_end on announcements(application_end);
create index if not exists idx_companies_user_id on companies(user_id);
create index if not exists idx_matches_company_id on matches(company_id);
create index if not exists idx_matches_announcement_id on matches(announcement_id);
create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);

-- Create vector similarity search function
create or replace function match_announcements(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  organization text,
  similarity float
)
language sql stable
as $$
  select
    announcements.id,
    announcements.title,
    announcements.organization,
    1 - (announcements.embedding <=> query_embedding) as similarity
  from announcements
  where 1 - (announcements.embedding <=> query_embedding) > match_threshold
  order by announcements.embedding <=> query_embedding
  limit match_count;
$$;

-- Row Level Security policies
alter table companies enable row level security;
alter table business_plans enable row level security;
alter table matches enable row level security;
alter table applications enable row level security;
alter table payments enable row level security;
alter table subscriptions enable row level security;
alter table saved_announcements enable row level security;

-- Companies: users can only access their own companies
create policy "Users can view own companies" on companies for select using (auth.uid() = user_id);
create policy "Users can insert own companies" on companies for insert with check (auth.uid() = user_id);
create policy "Users can update own companies" on companies for update using (auth.uid() = user_id);
create policy "Users can delete own companies" on companies for delete using (auth.uid() = user_id);

-- Business plans: users can only access plans for their companies
create policy "Users can view own business plans" on business_plans for select
  using (company_id in (select id from companies where user_id = auth.uid()));
create policy "Users can insert own business plans" on business_plans for insert
  with check (company_id in (select id from companies where user_id = auth.uid()));
create policy "Users can update own business plans" on business_plans for update
  using (company_id in (select id from companies where user_id = auth.uid()));
create policy "Users can delete own business plans" on business_plans for delete
  using (company_id in (select id from companies where user_id = auth.uid()));

-- Matches: users can only access matches for their companies
create policy "Users can view own matches" on matches for select
  using (company_id in (select id from companies where user_id = auth.uid()));
create policy "Users can insert own matches" on matches for insert
  with check (company_id in (select id from companies where user_id = auth.uid()));

-- Applications: users can only access their own applications
create policy "Users can view own applications" on applications for select using (auth.uid() = user_id);
create policy "Users can insert own applications" on applications for insert with check (auth.uid() = user_id);
create policy "Users can update own applications" on applications for update using (auth.uid() = user_id);

-- Payments: users can only access their own payments
create policy "Users can view own payments" on payments for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on payments for insert with check (auth.uid() = user_id);

-- Subscriptions: users can only access their own subscriptions
create policy "Users can view own subscriptions" on subscriptions for select using (auth.uid() = user_id);

-- Saved announcements: users can only access their own saved items
create policy "Users can view own saved" on saved_announcements for select using (auth.uid() = user_id);
create policy "Users can insert own saved" on saved_announcements for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved" on saved_announcements for delete using (auth.uid() = user_id);

-- Announcements: public read access
create policy "Anyone can view announcements" on announcements for select to authenticated using (true);
