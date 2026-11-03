CREATE TABLE IF NOT EXISTS raw.staging_rejected (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(64) NOT NULL,
  reason VARCHAR(255),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
