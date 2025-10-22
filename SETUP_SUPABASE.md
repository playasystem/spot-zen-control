# Configuración de Supabase

Este documento te guiará en la configuración de la base de datos en Supabase para el sistema Spot Zen Control.

## 🚀 Pasos para configurar Supabase

### 1️⃣ Ejecutar las migraciones

Las migraciones ya están en el proyecto en `supabase/migrations/`. Para aplicarlas:

1. Ve a tu proyecto en Supabase: https://mepnlxiqryetwtquogae.supabase.co
2. Ve a **SQL Editor** en el menú lateral
3. Copia y pega el contenido del archivo `supabase/migrations/20251022143903_a06e2d80-e1da-4be9-a048-dcdce22391b6.sql`
4. Haz clic en **RUN** para ejecutar la migración

Esto creará:
- ✅ Todas las tablas (clientes, vehículos, lugares, ingresos, pagos, tarifas)
- ✅ Los tipos enumerados (tipo_vehiculo, estado_lugar, etc.)
- ✅ Las políticas de seguridad RLS
- ✅ 12 lugares para autos (numerados del 1-12)
- ✅ 14 lugares para motos (numerados del 1-14)
- ✅ Tarifas por defecto

### 2️⃣ Verificar que los lugares se crearon

Para verificar que los lugares están en la base de datos:

1. Ve a **SQL Editor** en Supabase
2. Ejecuta esta consulta:

```sql
SELECT tipo, COUNT(*) as cantidad, 
       COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
       COUNT(CASE WHEN estado = 'ocupado' THEN 1 END) as ocupados
FROM lugares 
GROUP BY tipo;
```

Deberías ver:
- `auto`: 12 lugares (todos disponibles)
- `moto`: 14 lugares (todos disponibles)

### 3️⃣ Si los lugares no aparecen

Si ejecutaste las migraciones pero no ves los lugares, puedes ejecutar el script de seed:

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido del archivo `supabase/seed.sql`
3. Haz clic en **RUN**

Este script verificará si existen lugares y los creará si no existen.

### 4️⃣ Crear un usuario para el sistema

Para poder iniciar sesión en la aplicación:

1. Ve a **Authentication** → **Users** en Supabase
2. Haz clic en **Add user** → **Create new user**
3. Ingresa:
   - Email: tu email
   - Password: tu contraseña
   - Confirma que "Auto Confirm User" esté activado

## 📊 Estructura de la base de datos

### Tablas principales:

- **clientes**: Información de clientes (mensuales y por hora)
- **vehiculos**: Patentes y datos de vehículos
- **lugares**: Espacios de estacionamiento (autos y motos)
- **ingresos**: Registros de entrada/salida de vehículos
- **pagos**: Pagos de clientes mensuales
- **tarifas**: Precios por tipo de vehículo

### Tipos de vehículos:
- `auto`
- `moto`
- `camioneta`

### Estados de lugares:
- `disponible`: El lugar está libre
- `ocupado`: Hay un vehículo estacionado
- `reservado`: Reservado para cliente mensual

## 🔐 Configuración de autenticación

Las políticas RLS (Row Level Security) están configuradas para permitir todas las operaciones a usuarios autenticados. Solo los usuarios con cuenta en Supabase podrán acceder al sistema.

## ❓ Troubleshooting

### Problema: No se ven los lugares en el mapa

**Solución:**
1. Verifica que estés autenticado en la aplicación
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que las credenciales en `.env` sean correctas
4. Ejecuta la consulta de verificación en SQL Editor

### Problema: Error de permisos al consultar datos

**Solución:**
1. Verifica que las políticas RLS estén creadas (revisa la migración)
2. Asegúrate de estar autenticado
3. En SQL Editor, ejecuta: `SELECT * FROM lugares LIMIT 1;` para verificar permisos

### Problema: Las migraciones ya fueron ejecutadas

Si ya ejecutaste las migraciones y quieres resetear la base de datos:

```sql
-- ⚠️ CUIDADO: Esto eliminará TODOS los datos
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS ingresos CASCADE;
DROP TABLE IF EXISTS lugares CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS tarifas CASCADE;
DROP TYPE IF EXISTS estado_lugar CASCADE;
DROP TYPE IF EXISTS tipo_pago CASCADE;
DROP TYPE IF EXISTS tipo_cliente CASCADE;
DROP TYPE IF EXISTS tipo_vehiculo CASCADE;

-- Luego vuelve a ejecutar la migración completa
```

## 📝 Tarifas por defecto

El sistema viene con estas tarifas preconfiguradas:
- **Auto**: $2,000/hora (fracción: 30 minutos)
- **Moto**: $1,000/hora (fracción: 30 minutos)
- **Camioneta**: $2,500/hora (fracción: 30 minutos)

Puedes modificarlas desde la tabla `tarifas` en Supabase o desde la aplicación (cuando implementes esa funcionalidad).

