-- UP
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(128) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  status SMALLINT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_strategies_code ON strategies(code);

-- DOWN
/*
DROP TABLE IF EXISTS strategies;
*/
