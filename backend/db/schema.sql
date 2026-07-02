CREATE TABLE IF NOT EXISTS zonas (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO zonas (id, nombre) VALUES ('zona1', 'Zona Principal') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS log_acciones (
  id SERIAL PRIMARY KEY,
  zona_id VARCHAR(50) REFERENCES zonas(id),
  actuador VARCHAR(50) NOT NULL,
  estado VARCHAR(10) NOT NULL,
  origen VARCHAR(20) NOT NULL,
  sensor_disparador VARCHAR(50),
  valor_sensor NUMERIC(7,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_zona_timestamp ON log_acciones (zona_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS riegos_programados (
  id SERIAL PRIMARY KEY,
  zona_id VARCHAR(50) REFERENCES zonas(id),
  actuador VARCHAR(50) NOT NULL,
  hora TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  dias_semana INTEGER[] NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_riegos_zona ON riegos_programados (zona_id) WHERE activo = true;
