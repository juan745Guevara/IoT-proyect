CREATE TABLE IF NOT EXISTS lecturas_sensores (
  id SERIAL PRIMARY KEY,
  temperatura NUMERIC(5,2),
  humedad_aire NUMERIC(5,2),
  humedad_suelo INTEGER,
  luminosidad INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lecturas_sensores ADD COLUMN IF NOT EXISTS zona_id VARCHAR(50);

UPDATE lecturas_sensores SET zona_id = 'zona1' WHERE zona_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_lecturas_timestamp ON lecturas_sensores (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lecturas_zona_timestamp ON lecturas_sensores (zona_id, timestamp DESC);
