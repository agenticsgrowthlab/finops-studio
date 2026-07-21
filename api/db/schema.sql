-- AI FinOps Architecture Studio
-- Full Schema — Multi-tenant ready, single-tenant in UI
-- Org: Agentics Growth Lab

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'enterprise',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Model Pricing (server-maintained — Claude never invents prices)
CREATE TABLE IF NOT EXISTS model_pricing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id            TEXT NOT NULL,
  provider            TEXT NOT NULL,
  display_name        TEXT NOT NULL,
  cost_per_1m_input   NUMERIC(10,4) NOT NULL,
  cost_per_1m_output  NUMERIC(10,4) NOT NULL,
  strengths           JSONB NOT NULL DEFAULT '[]',
  weaknesses          JSONB NOT NULL DEFAULT '[]',
  best_for            TEXT,
  effective_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  deprecated_at       DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('existing', 'new')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  description       TEXT,
  budget_annual     NUMERIC(12,2),
  arch_score        INTEGER,
  cost_score        TEXT CHECK (cost_score IN ('A','B','C','D')),
  risk_level        TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  model_id              TEXT NOT NULL,
  calls_per_day         INTEGER NOT NULL DEFAULT 0,
  prompt_tokens_avg     INTEGER NOT NULL DEFAULT 0,
  completion_tokens_avg INTEGER NOT NULL DEFAULT 0,
  cost_month            NUMERIC(10,2) NOT NULL DEFAULT 0,
  caching_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  annual_target   NUMERIC(12,2) NOT NULL,
  monthly_target  NUMERIC(12,2) GENERATED ALWAYS AS (annual_target / 12) STORED,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, year)
);

-- Snapshots
CREATE TABLE IF NOT EXISTS snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service_id   UUID REFERENCES services(id) ON DELETE SET NULL,
  spend        NUMERIC(10,2) NOT NULL,
  period_label TEXT NOT NULL,
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guardrails
CREATE TABLE IF NOT EXISTS guardrails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  label         TEXT NOT NULL,
  threshold     NUMERIC(12,4),
  operator      TEXT CHECK (operator IN ('lte','gte','eq','neq')),
  action        TEXT NOT NULL DEFAULT 'alert' CHECK (action IN ('alert','block','warn')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','warning','breach','disabled')),
  current_value NUMERIC(12,4),
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  guardrail_id  UUID REFERENCES guardrails(id) ON DELETE SET NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  message       TEXT NOT NULL,
  detail        TEXT,
  triggered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

-- Architecture Reviews
CREATE TABLE IF NOT EXISTS architecture_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  interview_answers     JSONB NOT NULL DEFAULT '{}',
  recommended_arch      TEXT,
  retrieval_strategy    TEXT,
  knowledge_strategy    TEXT,
  model_choices         JSONB NOT NULL DEFAULT '[]',
  assumptions           JSONB NOT NULL DEFAULT '[]',
  risks                 JSONB NOT NULL DEFAULT '[]',
  guardrails_triggered  JSONB NOT NULL DEFAULT '[]',
  approval_status       TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft','approved','rejected','needs_revision')),
  approval_recommendation TEXT,
  claude_summary        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estimates
CREATE TABLE IF NOT EXISTS estimates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  review_id         UUID REFERENCES architecture_reviews(id) ON DELETE SET NULL,
  model_id          TEXT NOT NULL,
  calls_per_day     INTEGER NOT NULL,
  prompt_tokens     INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  cost_low_month    NUMERIC(10,2) NOT NULL,
  cost_exp_month    NUMERIC(10,2) NOT NULL,
  cost_high_month   NUMERIC(10,2) NOT NULL,
  cost_low_annual   NUMERIC(12,2) NOT NULL,
  cost_exp_annual   NUMERIC(12,2) NOT NULL,
  cost_high_annual  NUMERIC(12,2) NOT NULL,
  methodology       TEXT,
  assumptions       JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decisions
CREATE TABLE IF NOT EXISTS decisions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  rationale               TEXT,
  model_chosen            TEXT,
  alternatives_considered JSONB NOT NULL DEFAULT '[]',
  quality_impact          TEXT CHECK (quality_impact IN ('positive','neutral','negative')),
  cost_impact             TEXT,
  risk_impact             TEXT CHECK (risk_impact IN ('low','medium','high')),
  owner                   TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approval_date           DATE,
  linked_guardrails       JSONB NOT NULL DEFAULT '[]',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  priority    TEXT NOT NULL CHECK (priority IN ('high','medium','low')),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','dismissed')),
  source      TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('system','claude','user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  report_type     TEXT NOT NULL CHECK (report_type IN ('executive_summary','project_report','arch_review','scenario')),
  narrative       TEXT,
  data_snapshot   JSONB NOT NULL DEFAULT '{}',
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_services_project ON services(project_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_project ON snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_guardrails_project ON guardrails(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_project ON recommendations(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_reviews_project ON architecture_reviews(project_id);