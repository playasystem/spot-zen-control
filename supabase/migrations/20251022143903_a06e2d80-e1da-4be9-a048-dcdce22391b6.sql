-- Crear tipos enumerados
CREATE TYPE tipo_vehiculo AS ENUM ('auto', 'camioneta', 'moto');
CREATE TYPE tipo_cliente AS ENUM ('mensual', 'por_hora');
CREATE TYPE tipo_pago AS ENUM ('efectivo', 'transferencia');
CREATE TYPE estado_lugar AS ENUM ('disponible', 'ocupado', 'reservado');

-- Tabla de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  dni TEXT UNIQUE,
  tipo_cliente tipo_cliente NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de vehículos
CREATE TABLE vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente TEXT UNIQUE NOT NULL,
  tipo tipo_vehiculo NOT NULL,
  marca TEXT,
  color TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de lugares de estacionamiento
CREATE TABLE lugares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  tipo tipo_vehiculo NOT NULL,
  estado estado_lugar DEFAULT 'disponible',
  vehiculo_actual_id UUID REFERENCES vehiculos(id) ON DELETE SET NULL,
  cliente_asignado_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  UNIQUE(numero, tipo)
);

-- Tabla de tarifas
CREATE TABLE tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_vehiculo tipo_vehiculo NOT NULL UNIQUE,
  precio_hora DECIMAL(10,2) NOT NULL,
  fraccion_minutos INTEGER DEFAULT 30
);

-- Tabla de ingresos (movimientos de entrada/salida)
CREATE TABLE ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE CASCADE,
  lugar_id UUID REFERENCES lugares(id),
  hora_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hora_salida TIMESTAMPTZ,
  monto DECIMAL(10,2),
  tipo_cliente tipo_cliente NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pagos (para clientes mensuales)
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  monto DECIMAL(10,2) NOT NULL,
  tipo_pago tipo_pago NOT NULL,
  periodo_desde DATE NOT NULL,
  periodo_hasta DATE NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tarifas por defecto
INSERT INTO tarifas (tipo_vehiculo, precio_hora, fraccion_minutos) VALUES
  ('auto', 2000, 30),
  ('camioneta', 2500, 30),
  ('moto', 1000, 30);

-- Crear lugares de estacionamiento
INSERT INTO lugares (numero, tipo) 
SELECT generate_series(1, 12), 'auto'::tipo_vehiculo;

INSERT INTO lugares (numero, tipo) 
SELECT generate_series(1, 14), 'moto'::tipo_vehiculo;

-- Habilitar Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lugares ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todo a usuarios autenticados - solo admin usa el sistema)
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar clientes" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver vehiculos" ON vehiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar vehiculos" ON vehiculos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar vehiculos" ON vehiculos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar vehiculos" ON vehiculos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver lugares" ON lugares FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden actualizar lugares" ON lugares FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver tarifas" ON tarifas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden actualizar tarifas" ON tarifas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver ingresos" ON ingresos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar ingresos" ON ingresos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar ingresos" ON ingresos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar ingresos" ON ingresos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver pagos" ON pagos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar pagos" ON pagos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar pagos" ON pagos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar pagos" ON pagos FOR DELETE TO authenticated USING (true);

-- Índices para mejorar rendimiento
CREATE INDEX idx_vehiculos_cliente ON vehiculos(cliente_id);
CREATE INDEX idx_lugares_estado ON lugares(estado);
CREATE INDEX idx_ingresos_vehiculo ON ingresos(vehiculo_id);
CREATE INDEX idx_ingresos_fecha ON ingresos(hora_entrada);
CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);