-- =============================================================================
-- Token GitHub (PAT) por projeto para repositórios privados
-- =============================================================================

ALTER TABLE projects
  ADD COLUMN github_token text;

DROP VIEW project_overview;

CREATE VIEW project_overview WITH (security_invoker = true) AS
SELECT
  p.id,
  p.name,
  p.description,
  p.status,
  p.progress_percentage,
  p.due_date,
  p.archived_at,
  p.github_repo,
  p.github_url,
  p.github_default_branch,
  p.github_last_synced_at,
  (p.github_token IS NOT NULL) AS has_github_token,
  p.created_by,
  u.name AS created_by_name,
  p.created_at,
  p.updated_at,
  st.total_stages,
  st.done_stages,
  st.overdue_stages,
  cs.current_stage,
  tk.open_tasks,
  tk.triage_tasks,
  tk.pending_manager_requests
FROM projects p
JOIN users u ON u.id = p.created_by
CROSS JOIN LATERAL (
  SELECT
    count(*)::int                                                              AS total_stages,
    count(*) FILTER (WHERE s.status = 'DONE')::int                             AS done_stages,
    count(*) FILTER (WHERE s.status <> 'DONE' AND s.due_date < current_date)::int AS overdue_stages
  FROM project_stages s
  WHERE s.project_id = p.id
) st
LEFT JOIN LATERAL (
  SELECT json_build_object(
           'id', s.id,
           'title', s.title,
           'status', s.status,
           'orderIndex', s.order_index,
           'dueDate', s.due_date
         ) AS current_stage
  FROM project_stages s
  WHERE s.project_id = p.id AND s.status <> 'DONE'
  ORDER BY (s.status = 'ACTIVE') DESC, s.order_index
  LIMIT 1
) cs ON true
CROSS JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE t.status <> 'DONE')::int                              AS open_tasks,
    count(*) FILTER (WHERE t.status = 'BACKLOG')::int                            AS triage_tasks,
    count(*) FILTER (WHERE t.source <> 'ENGINEER' AND t.status <> 'DONE')::int   AS pending_manager_requests
  FROM tasks t
  WHERE t.project_id = p.id
) tk;
