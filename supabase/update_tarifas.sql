-- Script para actualizar las tarifas según el nuevo esquema
-- Ejecuta este script en Supabase SQL Editor

-- Primero, agregar nuevas columnas a la tabla tarifas si no existen
DO $$ 
BEGIN
    -- Agregar columna para indicar si es por turno o por hora
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tarifas' AND column_name = 'es_por_turno') THEN
        ALTER TABLE tarifas ADD COLUMN es_por_turno BOOLEAN DEFAULT false;
    END IF;
    
    -- Agregar columna para duración del turno en horas (para motos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tarifas' AND column_name = 'duracion_turno_horas') THEN
        ALTER TABLE tarifas ADD COLUMN duracion_turno_horas INTEGER DEFAULT NULL;
    END IF;
END $$;

-- Actualizar las tarifas según el nuevo esquema
-- Auto: $2000/hora, fracción cada 30 minutos
UPDATE tarifas 
SET precio_hora = 2000, 
    fraccion_minutos = 30,
    es_por_turno = false,
    duracion_turno_horas = NULL
WHERE tipo_vehiculo = 'auto';

-- Camioneta: $2400/hora, fracción cada 30 minutos
UPDATE tarifas 
SET precio_hora = 2400, 
    fraccion_minutos = 30,
    es_por_turno = false,
    duracion_turno_horas = NULL
WHERE tipo_vehiculo = 'camioneta';

-- Moto: $1000 por turno de 8 horas
-- Guardamos como precio_hora = 1000 (es el precio del turno)
-- fraccion_minutos ya no aplica para motos, usamos es_por_turno
UPDATE tarifas 
SET precio_hora = 1000,  -- Precio del turno completo
    fraccion_minutos = 480,  -- 8 horas en minutos (para referencia)
    es_por_turno = true,
    duracion_turno_horas = 8
WHERE tipo_vehiculo = 'moto';

-- Crear tabla de turnos si no existe
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  orden INTEGER NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en la tabla turnos
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Políticas para turnos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver turnos" ON turnos;
CREATE POLICY "Usuarios autenticados pueden ver turnos" 
ON turnos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar turnos" ON turnos;
CREATE POLICY "Usuarios autenticados pueden actualizar turnos" 
ON turnos FOR UPDATE TO authenticated USING (true);

-- Insertar los turnos
INSERT INTO turnos (nombre, hora_inicio, hora_fin, orden) VALUES
  ('Mañana', '06:00:00', '14:00:00', 1),
  ('Tarde', '14:00:00', '22:00:00', 2),
  ('Noche', '22:00:00', '06:00:00', 3)
ON CONFLICT DO NOTHING;

-- Verificar las nuevas tarifas
SELECT 
  tipo_vehiculo,
  precio_hora,
  fraccion_minutos,
  es_por_turno,
  duracion_turno_horas,
  CASE 
    WHEN es_por_turno THEN 'Tarifa por turno de ' || duracion_turno_horas || ' horas: $' || precio_hora
    ELSE 'Tarifa por hora: $' || precio_hora || ' (fracción cada ' || fraccion_minutos || ' minutos)'
  END as descripcion
FROM tarifas
ORDER BY tipo_vehiculo;

-- Verificar los turnos
SELECT * FROM turnos ORDER BY orden;

