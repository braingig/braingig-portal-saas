-- Extended HR employee fields for the employee modal

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS salary_type TEXT NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS skills TEXT;

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_salary_type_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_salary_type_check
  CHECK (salary_type IN ('fixed', 'hourly'));

NOTIFY pgrst, 'reload schema';
