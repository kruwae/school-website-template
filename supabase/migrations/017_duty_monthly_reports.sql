-- Monthly duty reporting (additive, backward-compatible)
-- Adds:
-- 1) signature storage per user
-- 2) monthly report headers
-- 3) monthly report daily snapshot items
-- 4) monthly report headcount rows
-- 5) additive daily headcount columns on duty_records
-- 6) helper trigger for updated_at maintenance

create extension if not exists pgcrypto;

create table if not exists public.user_signatures (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.app_users(id) on delete cascade,
    signature_url text not null,
    signature_name text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_user_signatures_user_id on public.user_signatures(user_id);
create index if not exists idx_user_signatures_active on public.user_signatures(is_active);

create table if not exists public.duty_monthly_reports (
    id uuid primary key default gen_random_uuid(),
    report_year integer not null,
    report_month integer not null check (report_month between 1 and 12),
    report_period_start date not null,
    report_period_end date not null,
    title text not null,
    semester_label text,
    academic_year_label text,
    cover_note text,
    day_summary_intro text,
    night_summary_intro text,
    approval_note text,
    status text not null default 'draft' check (status in ('draft', 'submitted', 'approved_level_1', 'approved_level_2', 'completed')),
    generated_at timestamptz not null default now(),
    generated_by_user_id uuid references public.app_users(id) on delete set null,
    submitted_at timestamptz,
    submitted_by_user_id uuid references public.app_users(id) on delete set null,
    approved_level_1_at timestamptz,
    approved_level_1_by_user_id uuid references public.app_users(id) on delete set null,
    approved_level_2_at timestamptz,
    approved_level_2_by_user_id uuid references public.app_users(id) on delete set null,
    pdf_file_path text,
    pdf_file_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint duty_monthly_reports_unique_period unique (report_year, report_month)
);

create index if not exists idx_duty_monthly_reports_status on public.duty_monthly_reports(status);
create index if not exists idx_duty_monthly_reports_period on public.duty_monthly_reports(report_period_start, report_period_end);

create table if not exists public.duty_monthly_report_items (
    id uuid primary key default gen_random_uuid(),
    monthly_report_id uuid not null references public.duty_monthly_reports(id) on delete cascade,
    duty_record_id uuid references public.duty_records(id) on delete set null,
    assignment_id uuid references public.duty_assignments(id) on delete set null,
    duty_date date not null,
    duty_shift text,
    duty_shift_label text,
    assigned_user_id uuid references public.app_users(id) on delete set null,
    assigned_name text,
    assigned_position text,
    final_duty_user_id uuid references public.app_users(id) on delete set null,
    final_duty_name text,
    final_duty_position text,
    recorder_name text,
    recorder_position text,
    swap_requested boolean not null default false,
    swap_response_status text,
    approval_ready boolean not null default false,
    incidents text,
    actions_taken text,
    remarks text,
    duty_images jsonb not null default '[]'::jsonb,
    is_day_shift boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_duty_monthly_report_items_report on public.duty_monthly_report_items(monthly_report_id);
create index if not exists idx_duty_monthly_report_items_record on public.duty_monthly_report_items(duty_record_id);
create index if not exists idx_duty_monthly_report_items_date on public.duty_monthly_report_items(duty_date);

create table if not exists public.duty_monthly_report_headcounts (
    id uuid primary key default gen_random_uuid(),
    monthly_report_id uuid not null references public.duty_monthly_reports(id) on delete cascade,
    duty_record_id uuid references public.duty_records(id) on delete set null,
    duty_date date not null,
    check_time text not null check (check_time in ('07:00', '17:00')),
    group_name text not null,
    full_count integer not null default 0,
    sick_count integer not null default 0,
    returned_home_count integer not null default 0,
    other_count integer not null default 0,
    present_count integer not null default 0,
    recorder_name text,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_duty_monthly_report_headcounts_report on public.duty_monthly_report_headcounts(monthly_report_id);
create index if not exists idx_duty_monthly_report_headcounts_record on public.duty_monthly_report_headcounts(duty_record_id);

create table if not exists public.duty_monthly_report_signatures (
    id uuid primary key default gen_random_uuid(),
    monthly_report_id uuid not null references public.duty_monthly_reports(id) on delete cascade,
    signature_role text not null check (signature_role in ('prepared_by', 'checked_by', 'approved_level_1', 'approved_level_2')),
    signer_user_id uuid references public.app_users(id) on delete set null,
    signer_name text not null,
    signer_position text,
    signature_url text,
    signed_at timestamptz,
    is_required boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_duty_monthly_report_signatures_report on public.duty_monthly_report_signatures(monthly_report_id);

alter table public.duty_records
    add column if not exists summary_template_key text,
    add column if not exists summary_generated_text text,
    add column if not exists day_shift_note text,
    add column if not exists night_shift_note text;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_user_signatures_updated_at on public.user_signatures;
create trigger set_user_signatures_updated_at
before update on public.user_signatures
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_duty_monthly_reports_updated_at on public.duty_monthly_reports;
create trigger set_duty_monthly_reports_updated_at
before update on public.duty_monthly_reports
for each row
execute function public.set_updated_at_timestamp();
