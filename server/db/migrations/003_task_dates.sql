-- =============================================================================
-- Datas opcionais de início e entrega das tasks
-- =============================================================================

ALTER TABLE tasks
  ADD COLUMN start_date date,
  ADD COLUMN due_date   date,
  ADD CONSTRAINT tasks_dates_chk CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);

CREATE INDEX tasks_due_open_idx ON tasks (due_date) WHERE due_date IS NOT NULL AND status <> 'DONE';
