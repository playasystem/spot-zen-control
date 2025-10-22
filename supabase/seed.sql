-- Script para inicializar o resetear los lugares de estacionamiento
-- Ejecuta este script en el SQL Editor de Supabase si no ves los lugares en el mapa

-- Primero, verificar si ya existen lugares
DO $$
BEGIN
  -- Si no hay lugares, crearlos
  IF NOT EXISTS (SELECT 1 FROM lugares LIMIT 1) THEN
    -- Crear lugares para autos (1-12)
    INSERT INTO lugares (numero, tipo, estado) 
    SELECT generate_series(1, 12), 'auto'::tipo_vehiculo, 'disponible'::estado_lugar;

    -- Crear lugares para motos (1-14)
    INSERT INTO lugares (numero, tipo, estado) 
    SELECT generate_series(1, 14), 'moto'::tipo_vehiculo, 'disponible'::estado_lugar;

    RAISE NOTICE 'Se crearon 12 lugares para autos y 14 para motos';
  ELSE
    RAISE NOTICE 'Los lugares ya existen. Total de lugares: %', (SELECT COUNT(*) FROM lugares);
  END IF;
END $$;

-- Verificar la creación
SELECT tipo, COUNT(*) as cantidad, 
       COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
       COUNT(CASE WHEN estado = 'ocupado' THEN 1 END) as ocupados
FROM lugares 
GROUP BY tipo;

