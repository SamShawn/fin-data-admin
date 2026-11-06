CREATE TABLE IF NOT EXISTS user_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_code VARCHAR(16) NOT NULL REFERENCES stocks(stock_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stock_code)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
