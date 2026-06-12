-- ============================================================
-- RZEN ISHARE — Migration 001: Employee Self-Activation
-- Additive only. Does NOT modify, drop, or alter existing
-- tables, columns, data, or policies.
-- Run this in Supabase SQL Editor AFTER the base schema.
-- ============================================================

-- ── Function: link_employee_profile ──────────────────────────
-- Called by a newly signed-up auth user (employee) to link their
-- new profile to an existing employees record, verified by
-- phone + emp_id match. Runs as security definer so it can read/
-- update the employees table even though the caller's RLS
-- policies on `employees` only allow authenticated reads of
-- active rows (this still requires the caller to be authenticated,
-- just bypasses the need for a broader read policy).
--
-- Returns the matched employee row's id on success, raises an
-- exception on mismatch / already-activated.
create or replace function link_employee_profile(p_emp_id text, p_phone text)
returns uuid as $$
declare
  v_employee_id uuid;
  v_existing_profile uuid;
begin
  -- Must be called by an authenticated user
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Find employee matching emp_id + phone (case-insensitive emp_id)
  select id, profile_id into v_employee_id, v_existing_profile
  from employees
  where upper(emp_id) = upper(p_emp_id)
    and phone = p_phone
    and is_active = true;

  if v_employee_id is null then
    raise exception 'No matching active employee found for the given Employee ID and phone number.';
  end if;

  if v_existing_profile is not null and v_existing_profile <> auth.uid() then
    raise exception 'This employee record is already linked to an account.';
  end if;

  -- Link this auth user to the employee record
  update employees
     set profile_id = auth.uid()
   where id = v_employee_id;

  -- Sync employee's system_role onto their profile (employees default to 'employee')
  update profiles
     set role = coalesce(
           (select system_role from employees where id = v_employee_id),
           'employee'
         )
   where id = auth.uid();

  return v_employee_id;
end;
$$ language plpgsql security definer;

-- Allow any authenticated user to call this (it self-checks identity)
grant execute on function link_employee_profile(text, text) to authenticated;

-- ============================================================
-- DONE — Migration 001
-- ============================================================
