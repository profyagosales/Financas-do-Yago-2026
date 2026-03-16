alter table public.mileage_programs
  add column if not exists goal_points integer,
  add column if not exists goal_due_date date,
  add column if not exists goal_notes text;

alter table public.mileage_programs
  drop constraint if exists mileage_programs_goal_points_check;

alter table public.mileage_programs
  add constraint mileage_programs_goal_points_check
  check (goal_points is null or goal_points > 0);
