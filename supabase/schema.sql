-- ============================================================
-- RZEN ISHARE — Complete Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Clean slate (drop in reverse dependency order) ───────────
drop table if exists contract_documents cascade;
drop table if exists contracts cascade;
drop table if exists project_members cascade;
drop table if exists projects cascade;
drop table if exists attendance cascade;
drop table if exists employees cascade;
drop table if exists work_locations cascade;
drop table if exists clients cascade;
drop table if exists departments cascade;
drop table if exists org_settings cascade;
drop table if exists profiles cascade;
drop type if exists user_role cascade;
drop type if exists employment_type cascade;
drop type if exists attendance_status cascade;
drop type if exists exit_reason cascade;
drop type if exists contract_status cascade;
drop type if exists location_type cascade;

-- ── Enums ─────────────────────────────────────────────────────
create type user_role as enum (
  'super_admin',
  'hr_manager',
  'department_head',
  'project_manager',
  'employee'
);

create type employment_type as enum (
  'full_time',
  'part_time',
  'contract',
  'intern'
);

create type attendance_status as enum (
  'present',
  'absent',
  'half_day',
  'leave'
);

create type exit_reason as enum (
  'resignation',
  'termination',
  'end_of_contract',
  'retirement',
  'other'
);

create type contract_status as enum (
  'draft',
  'active',
  'expired',
  'terminated'
);

create type location_type as enum (
  'office',
  'client_site',
  'remote_hub'
);

-- ── Shared trigger: updated_at ────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- MODULE 1 — Auth & Profiles
-- ============================================================

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  phone           text not null unique,          -- primary login identifier
  email           text,                          -- optional, not used for login
  role            user_role not null default 'employee',
  avatar_url      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile row when Supabase auth user is created
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Admin'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Org Settings (singleton row) ─────────────────────────────
create table org_settings (
  id              integer primary key default 1 check (id = 1),
  org_name        text not null default 'Rzen Ishare',
  org_logo_url    text,
  timezone        text not null default 'Asia/Kolkata',
  emp_id_prefix   text not null default 'RZ',
  emp_id_counter  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger org_settings_updated_at
  before update on org_settings
  for each row execute function set_updated_at();

insert into org_settings (id, org_name, timezone, emp_id_prefix, emp_id_counter)
values (1, 'Rzen Ishare', 'Asia/Kolkata', 'RZ', 0);

-- ============================================================
-- MODULE 2 — Departments
-- ============================================================

create table departments (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  code            text not null unique,
  description     text,
  parent_id       uuid references departments(id) on delete set null,
  head_id         uuid,                          -- FK to employees added after employees table
  is_active       boolean not null default true,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger departments_updated_at
  before update on departments
  for each row execute function set_updated_at();

-- ============================================================
-- MODULE 7 — Clients (before work_locations which depends on it)
-- ============================================================

create table clients (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  code                    text not null unique,
  industry                text,
  primary_contact_name    text not null,
  primary_contact_email   text not null,
  primary_contact_phone   text,
  secondary_contact_name  text,
  secondary_contact_email text,
  billing_address         text,
  logo_url                text,
  website                 text,
  notes                   text,
  is_active               boolean not null default true,
  created_by              uuid references profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- ============================================================
-- MODULE 6 — Work Locations (depends on clients)
-- ============================================================

create table work_locations (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  client_id       uuid references clients(id) on delete set null,
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  state           text not null,
  pincode         text not null,
  country         text not null default 'India',
  location_type   location_type not null default 'office',
  contact_person  text,
  contact_phone   text,
  is_active       boolean not null default true,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger work_locations_updated_at
  before update on work_locations
  for each row execute function set_updated_at();

-- ============================================================
-- MODULE 4 — Employees (depends on departments, work_locations)
-- ============================================================

create table employees (
  id                      uuid primary key default uuid_generate_v4(),
  emp_id                  text unique,           -- auto-generated: RZ-001 etc.
  first_name              text not null,
  last_name               text not null,
  email                   text unique,
  phone                   text not null unique,
  department_id           uuid not null references departments(id),
  designation             text not null,
  date_of_joining         date not null,
  employment_type         employment_type not null,
  work_location_id        uuid references work_locations(id),
  reports_to              uuid references employees(id) on delete set null,
  date_of_birth           date,
  gender                  text,
  address                 text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  avatar_url              text,
  system_role             user_role default 'employee',
  profile_id              uuid references profiles(id),  -- linked if they have login
  is_active               boolean not null default true,
  exit_date               date,
  exit_reason             exit_reason,
  exit_notes              text,
  exited_at               timestamptz,
  created_by              uuid references profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger employees_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- Auto-generate RZ-001 style emp_id on insert
create or replace function generate_emp_id()
returns trigger as $$
declare
  prefix    text;
  counter   integer;
  new_id    text;
begin
  if new.emp_id is null then
    select emp_id_prefix, emp_id_counter + 1
    into prefix, counter
    from org_settings where id = 1
    for update;

    update org_settings set emp_id_counter = counter where id = 1;

    new_id := prefix || '-' || lpad(counter::text, 3, '0');
    new.emp_id := new_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger employees_gen_emp_id
  before insert on employees
  for each row execute function generate_emp_id();

-- Add department head FK now that employees table exists
alter table departments
  add constraint fk_dept_head
  foreign key (head_id) references employees(id) on delete set null;

-- ============================================================
-- MODULE 5 — Attendance (depends on employees, work_locations)
-- ============================================================

create table attendance (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references employees(id) on delete cascade,
  date            date not null,
  status          attendance_status not null,
  check_in_time   time,
  check_out_time  time,
  work_location_id uuid references work_locations(id),
  notes           text,
  marked_by       uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(employee_id, date)   -- one record per employee per day
);

create trigger attendance_updated_at
  before update on attendance
  for each row execute function set_updated_at();

-- ============================================================
-- MODULE 8 — Projects & Team Assignment
-- ============================================================

create table projects (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  code                text not null unique,
  client_id           uuid not null references clients(id),
  work_location_id    uuid references work_locations(id),
  project_manager_id  uuid references employees(id) on delete set null,
  start_date          date not null,
  end_date            date,
  description         text,
  is_active           boolean not null default true,
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create table project_members (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  role_on_project text not null,
  start_date      date not null,
  end_date        date,
  assigned_by     uuid references profiles(id),
  assigned_at     timestamptz not null default now(),
  unique(project_id, employee_id)
);

-- ============================================================
-- MODULE 9 — Contracts (depends on clients, projects)
-- ============================================================

create table contracts (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  contract_number text not null unique,
  client_id       uuid not null references clients(id),
  project_id      uuid references projects(id) on delete set null,
  start_date      date not null,
  end_date        date not null,
  value_inr       numeric(15, 2) not null,
  status          contract_status not null default 'draft',
  renewal_date    date,
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger contracts_updated_at
  before update on contracts
  for each row execute function set_updated_at();

-- Contract documents (file references stored in Supabase Storage)
create table contract_documents (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid not null references contracts(id) on delete cascade,
  file_name       text not null,
  storage_path    text not null,
  uploaded_by     uuid references profiles(id),
  uploaded_at     timestamptz not null default now()
);

-- ============================================================
-- INDEXES — for fast lookups
-- ============================================================

create index idx_employees_department    on employees(department_id);
create index idx_employees_work_location on employees(work_location_id);
create index idx_employees_doj           on employees(date_of_joining);
create index idx_employees_active        on employees(is_active);
create index idx_attendance_employee     on attendance(employee_id);
create index idx_attendance_date         on attendance(date);
create index idx_attendance_location     on attendance(work_location_id);
create index idx_project_members_project on project_members(project_id);
create index idx_project_members_emp     on project_members(employee_id);
create index idx_contracts_client        on contracts(client_id);
create index idx_work_locations_client   on work_locations(client_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles          enable row level security;
alter table org_settings      enable row level security;
alter table departments       enable row level security;
alter table clients           enable row level security;
alter table work_locations    enable row level security;
alter table employees         enable row level security;
alter table attendance        enable row level security;
alter table projects          enable row level security;
alter table project_members   enable row level security;
alter table contracts         enable row level security;
alter table contract_documents enable row level security;

-- Helper: get current user's role
create or replace function current_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: is current user one of these roles?
create or replace function has_role(variadic roles user_role[])
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = any(roles)
  );
$$ language sql security definer stable;

-- ── profiles ─────────────────────────────────────────────────
create policy "Own profile: read"       on profiles for select using (auth.uid() = id);
create policy "Admin: read all profiles" on profiles for select using (has_role('super_admin','hr_manager'));
create policy "Own profile: update"     on profiles for update using (auth.uid() = id);
create policy "Admin: update profiles"  on profiles for update using (has_role('super_admin','hr_manager'));

-- ── org_settings ─────────────────────────────────────────────
create policy "Authenticated: read org"      on org_settings for select using (auth.role() = 'authenticated');
create policy "Super admin: update org"      on org_settings for update using (has_role('super_admin'));

-- ── departments ──────────────────────────────────────────────
create policy "Authenticated: read depts"    on departments for select using (auth.role() = 'authenticated');
create policy "HR+Admin: manage depts"       on departments for all using (has_role('super_admin','hr_manager'));

-- ── clients ──────────────────────────────────────────────────
create policy "Authenticated: read clients"  on clients for select using (auth.role() = 'authenticated');
create policy "HR+Admin+PM: manage clients"  on clients for all using (has_role('super_admin','hr_manager','project_manager'));

-- ── work_locations ───────────────────────────────────────────
create policy "Authenticated: read locations" on work_locations for select using (auth.role() = 'authenticated');
create policy "HR+Admin: manage locations"    on work_locations for all using (has_role('super_admin','hr_manager'));

-- ── employees ────────────────────────────────────────────────
create policy "Authenticated: read employees" on employees for select using (auth.role() = 'authenticated');
create policy "HR+Admin: manage employees"    on employees for all using (has_role('super_admin','hr_manager'));
create policy "Dept head: read own dept"      on employees for select using (
  has_role('department_head') and
  department_id in (
    select id from departments where head_id in (
      select id from employees where profile_id = auth.uid()
    )
  )
);

-- ── attendance ───────────────────────────────────────────────
create policy "HR+Admin+DeptHead+PM: manage attendance" on attendance for all
  using (has_role('super_admin','hr_manager','department_head','project_manager'));
create policy "Employee: read own attendance" on attendance for select
  using (employee_id in (select id from employees where profile_id = auth.uid()));

-- ── projects ─────────────────────────────────────────────────
create policy "Authenticated: read projects"  on projects for select using (auth.role() = 'authenticated');
create policy "Admin+HR+PM: manage projects"  on projects for all using (has_role('super_admin','hr_manager','project_manager'));

-- ── project_members ──────────────────────────────────────────
create policy "Authenticated: read members"   on project_members for select using (auth.role() = 'authenticated');
create policy "Admin+HR+PM: manage members"   on project_members for all using (has_role('super_admin','hr_manager','project_manager'));

-- ── contracts ────────────────────────────────────────────────
create policy "HR+Admin: read contracts"      on contracts for select using (has_role('super_admin','hr_manager'));
create policy "HR+Admin: manage contracts"    on contracts for all using (has_role('super_admin','hr_manager'));

-- ── contract_documents ───────────────────────────────────────
create policy "HR+Admin: read contract docs"  on contract_documents for select using (has_role('super_admin','hr_manager'));
create policy "HR+Admin: manage contract docs" on contract_documents for all using (has_role('super_admin','hr_manager'));

-- ============================================================
-- STORAGE BUCKET — contract documents
-- ============================================================
-- Run this separately if needed:
-- insert into storage.buckets (id, name, public) values ('contracts', 'contracts', false);

-- ============================================================
-- DONE — Schema ready
-- ============================================================
