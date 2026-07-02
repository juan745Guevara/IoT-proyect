
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'lectura',
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas (
  id SERIAL PRIMARY KEY,
  zona_id VARCHAR(50) REFERENCES zonas(id),
  tipo VARCHAR(50) NOT NULL,
  sensor VARCHAR(50),
  mensaje TEXT NOT NULL,
  valor NUMERIC(10,2),
  umbral NUMERIC(10,2),
  resuelta BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_zona ON alertas (zona_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS comandos_pendientes (
  id SERIAL PRIMARY KEY,
  zona_id VARCHAR(50) NOT NULL,
  actuador VARCHAR(50) NOT NULL,
  estado VARCHAR(10) NOT NULL,
  origen VARCHAR(20) NOT NULL,
  intentos INTEGER DEFAULT 0,
  procesado BOOLEAN DEFAULT false,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comandos_pendientes ON comandos_pendientes (procesado, zona_id);

CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  nivel VARCHAR(20) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  mensaje TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_ts ON system_logs (timestamp DESC);

CREATE TABLE IF NOT EXISTS anomalias (
  id SERIAL PRIMARY KEY,
  zona_id VARCHAR(50) REFERENCES zonas(id),
  sensor VARCHAR(50) NOT NULL,
  valor_anterior NUMERIC(7,2),
  valor_actual NUMERIC(7,2),
  delta NUMERIC(7,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalias_zona ON anomalias (zona_id, timestamp DESC);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;
