-- MyBloom Life: single sync store. Every persistent "bloom_" key maps to one row.
-- value holds the exact raw text the client stores locally (both plain strings
-- like theme/role and JSON strings like goals/grades).
-- updated_at lets us do last-write-wins conflict resolution across devices.
CREATE TABLE IF NOT EXISTS bloom_state (
  id         TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bloom_state_updated_idx ON bloom_state (updated_at);