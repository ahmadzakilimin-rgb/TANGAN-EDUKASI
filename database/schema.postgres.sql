CREATE TABLE IF NOT EXISTS clean_logs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  activity_date DATE NOT NULL,
  participants BIGINT NOT NULL CHECK (participants > 0),
  plastic_kg NUMERIC(10, 1) NOT NULL DEFAULT 0 CHECK (plastic_kg >= 0),
  other_kg NUMERIC(10, 1) NOT NULL DEFAULT 0 CHECK (other_kg >= 0),
  bags BIGINT NOT NULL DEFAULT 0 CHECK (bags >= 0),
  notes VARCHAR(300) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
