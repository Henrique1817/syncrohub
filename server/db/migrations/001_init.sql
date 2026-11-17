-- =============================================================================
-- SyncroHub — schema inicial
-- Requer PostgreSQL 15+ (Supabase): usa `ON DELETE SET NULL (coluna)` em FKs compostas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
CREATE TYPE user_role       AS ENUM ('ENGINEER', 'MANAGER');
CREATE TYPE project_status  AS ENUM ('PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED');
CREATE TYPE stage_status    AS ENUM ('PENDING', 'ACTIVE', 'DONE');
CREATE TYPE task_priority   AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE task_status     AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE task_source     AS ENUM ('ENGINEER', 'MANAGER_REQUEST', 'IDEA');
CREATE TYPE idea_category   AS ENUM ('IDEA', 'SUGGESTION', 'ADJUSTMENT');
CREATE TYPE idea_status     AS ENUM ('UNDER_REVIEW', 'APPROVED', 'IMPLEMENTED', 'ARCHIVED');
CREATE TYPE activity_action AS ENUM (
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_STATUS_CHANGED', 'PROJECT_DELETED',
  'STAGE_CREATED', 'STAGE_UPDATED', 'STAGE_REORDERED', 'STAGE_ADVANCED', 'STAGE_REVERTED', 'STAGE_DELETED',
  'TASK_CREATED', 'TASK_TRIAGED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_DELETED',
  'IDEA_SUBMITTED', 'IDEA_FEEDBACK', 'IDEA_APPROVED', 'IDEA_STATUS_CHANGED',
  'COMMENT_ADDED', 'ENGINEER_UPDATE'
);

-- -----------------------------------------------------------------------------
-- Funções utilitárias
-- -----------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL CHECK (btrim(name) <> ''),
  email          text        NOT NULL CHECK (position('@' IN email) > 1),
  password_hash  text        NOT NULL,
  role           user_role   NOT NULL,
  position_title text,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email));

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
CREATE TABLE projects (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text           NOT NULL CHECK (btrim(name) <> ''),
  description         text,
  status              project_status NOT NULL DEFAULT 'PLANNING',
  progress_percentage smallint       NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  created_by          uuid           NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX projects_status_idx     ON projects (status);
CREATE INDEX projects_updated_at_idx ON projects (updated_at DESC);
CREATE INDEX projects_created_by_idx ON projects (created_by);

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- project_stages
-- -----------------------------------------------------------------------------
CREATE TABLE project_stages (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title        text         NOT NULL CHECK (btrim(title) <> ''),
  description  text,
  order_index  integer      NOT NULL CHECK (order_index >= 0),
  status       stage_status NOT NULL DEFAULT 'PENDING',
  due_date     date,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),

  -- Alvo das FKs compostas: garante que task/comentário e etapa pertencem ao mesmo projeto.
  CONSTRAINT project_stages_id_project_uq UNIQUE (id, project_id),
  -- DEFERRABLE permite reordenar etapas (trocar posições) num único UPDATE.
  CONSTRAINT project_stages_order_uq UNIQUE (project_id, order_index) DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT project_stages_completed_chk CHECK ((status = 'DONE') = (completed_at IS NOT NULL))
);

CREATE INDEX project_stages_project_status_idx ON project_stages (project_id, status);

CREATE TRIGGER project_stages_set_updated_at
  BEFORE UPDATE ON project_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- ideas_suggestions
-- -----------------------------------------------------------------------------
CREATE TABLE ideas_suggestions (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid          REFERENCES projects (id) ON DELETE SET NULL,
  author_id         uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  category          idea_category NOT NULL,
  title             text          NOT NULL CHECK (btrim(title) <> ''),
  content           text          NOT NULL,
  status            idea_status   NOT NULL DEFAULT 'UNDER_REVIEW',
  engineer_feedback text,
  reviewed_by       uuid          REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX ideas_status_created_idx ON ideas_suggestions (status, created_at DESC);
CREATE INDEX ideas_project_idx        ON ideas_suggestions (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX ideas_author_idx         ON ideas_suggestions (author_id);

CREATE TRIGGER ideas_set_updated_at
  BEFORE UPDATE ON ideas_suggestions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  stage_id     uuid,
  idea_id      uuid          UNIQUE REFERENCES ideas_suggestions (id) ON DELETE SET NULL,
  title        text          NOT NULL CHECK (btrim(title) <> ''),
  description  text,
  priority     task_priority NOT NULL DEFAULT 'MEDIUM',
  status       task_status   NOT NULL DEFAULT 'BACKLOG',
  source       task_source   NOT NULL,
  created_by   uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  assigned_to  uuid          REFERENCES users (id) ON DELETE SET NULL,
  triaged_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT tasks_stage_fk FOREIGN KEY (stage_id, project_id)
    REFERENCES project_stages (id, project_id) ON DELETE SET NULL (stage_id),
  CONSTRAINT tasks_completed_chk CHECK ((status = 'DONE') = (completed_at IS NOT NULL))
);

CREATE INDEX tasks_project_status_idx ON tasks (project_id, status);
CREATE INDEX tasks_stage_idx          ON tasks (stage_id) WHERE stage_id IS NOT NULL;
CREATE INDEX tasks_triage_queue_idx   ON tasks (priority DESC, created_at) WHERE status = 'BACKLOG';
CREATE INDEX tasks_assigned_open_idx  ON tasks (assigned_to) WHERE assigned_to IS NOT NULL AND status <> 'DONE';
CREATE INDEX tasks_created_by_idx     ON tasks (created_by);

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- comments (gestores comentam em projetos ou em etapas específicas)
-- -----------------------------------------------------------------------------
CREATE TABLE comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  stage_id   uuid,
  author_id  uuid        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  content    text        NOT NULL CHECK (btrim(content) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT comments_stage_fk FOREIGN KEY (stage_id, project_id)
    REFERENCES project_stages (id, project_id) ON DELETE SET NULL (stage_id)
);

CREATE INDEX comments_project_created_idx ON comments (project_id, created_at DESC);
CREATE INDEX comments_stage_idx           ON comments (stage_id) WHERE stage_id IS NOT NULL;
CREATE INDEX comments_author_idx          ON comments (author_id);

CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- activity_logs (append-only; id sequencial serve de cursor de paginação)
-- -----------------------------------------------------------------------------
CREATE TABLE activity_logs (
  id          bigint          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id  uuid            REFERENCES projects (id) ON DELETE CASCADE,
  user_id     uuid            REFERENCES users (id) ON DELETE SET NULL,
  action_type activity_action NOT NULL,
  description text            NOT NULL,
  metadata    jsonb           NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX activity_logs_project_id_idx ON activity_logs (project_id, id DESC);
CREATE INDEX activity_logs_user_idx       ON activity_logs (user_id);

-- -----------------------------------------------------------------------------
-- Progresso automático: % de etapas concluídas, recalculado a cada mudança de etapa
-- -----------------------------------------------------------------------------
CREATE FUNCTION recalc_project_progress(p_project_id uuid) RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE projects p
     SET progress_percentage = COALESCE((
           SELECT round(100.0 * count(*) FILTER (WHERE s.status = 'DONE') / NULLIF(count(*), 0))
             FROM project_stages s
            WHERE s.project_id = p_project_id
         ), 0)
   WHERE p.id = p_project_id;
$$;

CREATE FUNCTION project_stages_sync_progress() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalc_project_progress(NEW.project_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalc_project_progress(OLD.project_id);
  ELSE
    PERFORM recalc_project_progress(OLD.project_id);
    IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
      PERFORM recalc_project_progress(NEW.project_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER project_stages_sync_progress
  AFTER INSERT OR DELETE OR UPDATE OF status, project_id ON project_stages
  FOR EACH ROW EXECUTE FUNCTION project_stages_sync_progress();

-- -----------------------------------------------------------------------------
-- View de visão geral (dashboard da diretoria)
-- -----------------------------------------------------------------------------
CREATE VIEW project_overview WITH (security_invoker = true) AS
SELECT
  p.id,
  p.name,
  p.description,
  p.status,
  p.progress_percentage,
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

-- -----------------------------------------------------------------------------
-- Supabase: a API Node acessa o banco como owner (ignora RLS). Ativar RLS sem
-- policies bloqueia o acesso direto via PostgREST com as chaves anon/authenticated.
-- -----------------------------------------------------------------------------
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs     ENABLE ROW LEVEL SECURITY;
