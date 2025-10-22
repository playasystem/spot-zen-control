# 🔧 Solución Rápida: Mapa de Lugares No Se Ve

Si al abrir el Dashboard no ves el mapa de lugares o aparece vacío, sigue estos pasos:

## ✅ Paso 1: Verifica la conexión a Supabase

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Busca errores relacionados con Supabase

Si ves un error de autenticación o conexión:
- Verifica que el archivo `.env` exista en la raíz del proyecto
- Confirma que las credenciales sean correctas

## ✅ Paso 2: Verifica que los lugares existan en la base de datos

1. Ve a tu proyecto en Supabase: https://mepnlxiqryetwtquogae.supabase.co
2. Abre el **SQL Editor**
3. Ejecuta esta consulta:

```sql
SELECT COUNT(*) as total FROM lugares;
```

### Resultado esperado:
```
total: 26
```
(12 lugares para autos + 14 lugares para motos)

### Si el resultado es 0:

Ejecuta este script para crear los lugares:

```sql
-- Crear lugares para autos (1-12)
INSERT INTO lugares (numero, tipo, estado) 
SELECT generate_series(1, 12), 'auto'::tipo_vehiculo, 'disponible'::estado_lugar
ON CONFLICT DO NOTHING;

-- Crear lugares para motos (1-14)
INSERT INTO lugares (numero, tipo, estado) 
SELECT generate_series(1, 14), 'moto'::tipo_vehiculo, 'disponible'::estado_lugar
ON CONFLICT DO NOTHING;

-- Verificar
SELECT tipo, COUNT(*) as cantidad FROM lugares GROUP BY tipo;
```

## ✅ Paso 3: Verifica los permisos RLS

Si los lugares existen pero no se ven en la aplicación, puede ser un problema de permisos.

Ejecuta estas consultas en Supabase SQL Editor:

```sql
-- Ver las políticas RLS de la tabla lugares
SELECT * FROM pg_policies WHERE tablename = 'lugares';

-- Si no hay políticas, créalas:
CREATE POLICY "Usuarios autenticados pueden ver lugares" 
ON lugares FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden actualizar lugares" 
ON lugares FOR UPDATE TO authenticated USING (true);
```

## ✅ Paso 4: Verifica que estés autenticado

1. En la aplicación, asegúrate de haber iniciado sesión
2. Si no tienes un usuario, créalo en Supabase:
   - Ve a **Authentication** → **Users**
   - Haz clic en **Add user** → **Create new user**
   - Ingresa email y contraseña
   - Marca "Auto Confirm User"

## ✅ Paso 5: Limpia la caché y recarga

1. En el navegador, presiona `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
2. O abre las DevTools (F12) → pestaña **Network** → marca "Disable cache"

## 🎯 Script completo de verificación

Ejecuta este script en Supabase SQL Editor para verificar todo:

```sql
-- 1. Verificar que la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'lugares'
) as tabla_existe;

-- 2. Contar lugares
SELECT 
  tipo, 
  COUNT(*) as cantidad,
  COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
  COUNT(CASE WHEN estado = 'ocupado' THEN 1 END) as ocupados,
  COUNT(CASE WHEN estado = 'reservado' THEN 1 END) as reservados
FROM lugares 
GROUP BY tipo;

-- 3. Ver algunos lugares de ejemplo
SELECT * FROM lugares ORDER BY tipo, numero LIMIT 5;

-- 4. Verificar RLS
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'lugares';
```

## 🆘 Si nada funciona

1. **Ejecuta la migración completa** desde cero:
   - Abre el archivo `supabase/migrations/20251022143903_a06e2d80-e1da-4be9-a048-dcdce22391b6.sql`
   - Copia todo el contenido
   - Pégalo en Supabase SQL Editor
   - Haz clic en **RUN**

2. **Verifica las variables de entorno**:
   ```env
   VITE_SUPABASE_URL=https://mepnlxiqryetwtquogae.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=tu_api_key
   ```

3. **Reinicia el servidor de desarrollo**:
   - Detén el servidor (`Ctrl + C`)
   - Ejecuta `npm run dev` nuevamente

## 📞 Contacto

Si después de seguir todos estos pasos el problema persiste, revisa:
- Los logs de la consola del navegador (F12)
- Los logs de Supabase (en la pestaña Logs del dashboard)
- Verifica que tu proyecto Supabase esté activo y sin problemas

