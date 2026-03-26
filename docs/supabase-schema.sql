-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. Tabla de usuarios (extiende auth.users de Supabase)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('student', 'company')),
  wallet_address text,
  created_at timestamptz default now()
);

-- 2. Perfil de estudiante
create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  university text,
  career text,
  bio text
);

-- 3. Perfil de empresa
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  industry text,
  description text
);

-- 4. Certificados NFT
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  pdf_url text not null,
  nft_token_id text,
  tx_hash text,
  chain text default 'sepolia',
  created_at timestamptz default now()
);

-- 5. Ofertas de trabajo/pasantía
create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text,
  type text check (type in ('job', 'internship')),
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — habilitar en cada tabla
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.companies enable row level security;
alter table public.certificates enable row level security;
alter table public.job_posts enable row level security;

-- Políticas: usuarios ven/editan solo sus propios datos
create policy "users: own row" on public.users for all using (auth.uid() = id);
create policy "students: own row" on public.students for all using (
  user_id = (select id from public.users where id = auth.uid())
);
create policy "companies: own row" on public.companies for all using (
  user_id = (select id from public.users where id = auth.uid())
);
create policy "certificates: students read own" on public.certificates for select using (
  student_id in (select id from public.students where user_id = auth.uid())
);
create policy "certificates: insert own" on public.certificates for insert with check (
  student_id in (select id from public.students where user_id = auth.uid())
);
-- Empresas pueden leer todos los estudiantes y certificados
create policy "students: companies read all" on public.students for select using (true);
create policy "certificates: companies read all" on public.certificates for select using (true);
create policy "job_posts: own company" on public.job_posts for all using (
  company_id in (select id from public.companies where user_id = auth.uid())
);
create policy "job_posts: all read" on public.job_posts for select using (true);

-- Storage: crear bucket "certificates" en Supabase Dashboard → Storage
-- Configurarlo como público para poder obtener URLs públicas de los PDFs
