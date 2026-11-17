-- =============================================================================
-- Funcionários convidados por segmento (colaboradores)
-- =============================================================================

-- Colaborador: acompanha projetos, envia ideias/sugestões e comenta; não cria tasks.
-- Permitido dentro de transação (PG 12+) desde que o valor não seja usado nela.
ALTER TYPE user_role ADD VALUE 'COLLABORATOR';

CREATE TYPE department AS ENUM ('PURCHASING', 'FINANCE', 'SALES', 'BILLING', 'TECHNOLOGY', 'MANAGEMENT');

-- Convidados ainda não têm senha: ela é definida ao aceitar o convite.
ALTER TABLE users
  ADD COLUMN department   department,
  ADD COLUMN activated_at timestamptz,
  ALTER COLUMN password_hash DROP NOT NULL;

UPDATE users SET activated_at = created_at WHERE password_hash IS NOT NULL;

CREATE INDEX users_department_idx ON users (department) WHERE department IS NOT NULL;

-- Guardamos apenas o hash do token: o link enviado por e-mail não pode ser reconstruído a partir do banco.
CREATE TABLE user_invitations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash      text        NOT NULL UNIQUE,
  expires_at      timestamptz NOT NULL,
  accepted_at     timestamptz,
  revoked_at      timestamptz,
  created_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
  delivery_status text        NOT NULL DEFAULT 'PENDING'
                              CHECK (delivery_status IN ('PENDING', 'SENT', 'NOT_CONFIGURED', 'FAILED')),
  delivery_error  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_invitations_user_idx ON user_invitations (user_id, created_at DESC);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
