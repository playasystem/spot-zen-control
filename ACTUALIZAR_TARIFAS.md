# 🔄 Cómo Actualizar las Tarifas en tu Sistema

Has solicitado modificar el sistema de tarifas con las siguientes configuraciones:

## 📋 Nuevas Tarifas

### Autos
- **Precio:** $2,000 por hora
- **Fracción:** Cada 30 minutos
- **Cálculo:** Si estaciona 45 minutos = 1 hora completa = $2,000

### Camionetas
- **Precio:** $2,400 por hora
- **Fracción:** Cada 30 minutos
- **Cálculo:** Si estaciona 45 minutos = 1 hora completa = $2,400

### Motos
- **Precio:** $1,000 por turno
- **Duración del turno:** 8 horas
- **Turnos:**
  - 🌅 Mañana: 6:00 - 14:00
  - ☀️ Tarde: 14:00 - 22:00
  - 🌙 Noche: 22:00 - 6:00
- **Cálculo:** Si una moto está en el mismo turno = $1,000. Si pasa a otro turno, se cobra otro turno.

---

## 🚀 Pasos para Aplicar las Nuevas Tarifas

### 1️⃣ Ejecutar el Script SQL en Supabase

1. Ve a tu proyecto en Supabase: https://mepnlxiqryetwtquogae.supabase.co
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `supabase/update_tarifas.sql`
4. Haz clic en **RUN**

Este script hará lo siguiente:
- ✅ Actualizará las tarifas de autos, camionetas y motos
- ✅ Creará la tabla de turnos si no existe
- ✅ Insertará los 3 turnos configurados
- ✅ Mostrará un resumen de las tarifas actualizadas

### 2️⃣ Verificar que se Aplicaron los Cambios

Después de ejecutar el script, verifica con esta consulta:

```sql
SELECT 
  tipo_vehiculo,
  precio_hora,
  fraccion_minutos,
  es_por_turno,
  duracion_turno_horas,
  CASE 
    WHEN es_por_turno THEN 'Tarifa por turno: $' || precio_hora
    ELSE 'Tarifa por hora: $' || precio_hora || ' (cada ' || fraccion_minutos || ' min)'
  END as descripcion
FROM tarifas
ORDER BY tipo_vehiculo;
```

**Resultado esperado:**

| tipo_vehiculo | precio_hora | fraccion_minutos | es_por_turno | descripcion |
|---------------|-------------|------------------|--------------|-------------|
| auto | 2000 | 30 | false | Tarifa por hora: $2000 (cada 30 min) |
| camioneta | 2400 | 30 | false | Tarifa por hora: $2400 (cada 30 min) |
| moto | 1000 | 480 | true | Tarifa por turno: $1000 |

### 3️⃣ Gestionar Tarifas desde la App

Ahora puedes modificar las tarifas directamente desde la aplicación:

1. Inicia sesión en tu sistema
2. Ve a la sección **"Tarifas"** en el menú de navegación
3. Podrás ver y editar:
   - Precio por hora/turno
   - Fracciones de tiempo
   - Información de turnos
4. Los cambios se guardan instantáneamente

---

## 📊 Ejemplos de Cálculo

### Ejemplo 1: Auto - 45 minutos
- Entrada: 10:00
- Salida: 10:45
- Tiempo: 45 minutos
- Fracciones: Se redondea a 1 hora (2 fracciones de 30 min)
- **Monto: $2,000**

### Ejemplo 2: Auto - 2 horas y 15 minutos
- Entrada: 10:00
- Salida: 12:15
- Tiempo: 2 horas 15 minutos
- Fracciones: 5 fracciones de 30 min = 2.5 horas
- **Monto: $5,000** (2.5 × $2,000)

### Ejemplo 3: Camioneta - 1 hora exacta
- Entrada: 14:00
- Salida: 15:00
- Tiempo: 1 hora
- **Monto: $2,400**

### Ejemplo 4: Moto - Mismo turno
- Entrada: 08:00 (Turno Mañana)
- Salida: 12:00 (Turno Mañana)
- Tiempo: 4 horas
- Turnos: 1 (mismo turno)
- **Monto: $1,000**

### Ejemplo 5: Moto - Cambio de turno
- Entrada: 12:00 (Turno Mañana)
- Salida: 15:00 (Turno Tarde)
- Turnos: 2 (cambió de turno)
- **Monto: $2,000**

### Ejemplo 6: Moto - Múltiples turnos
- Entrada: 20:00 (Turno Tarde)
- Salida: 08:00 del día siguiente (Turno Mañana)
- Tiempo: 12 horas
- Turnos: 2 (Tarde + Noche + parte de Mañana)
- **Monto: $2,000** (se cobran 2 turnos completos)

---

## 🔍 Funcionalidades Implementadas

### ✅ En la Página de Entrada/Salida (`/ingresos`)

1. **Formulario de Entrada:**
   - Muestra las tarifas actualizadas en el selector de tipo de vehículo
   - Indica claramente: "Auto - $2,000/hora", "Moto - $1,000/turno", etc.
   - Información de turnos visible

2. **Diálogo de Salida:**
   - Muestra el turno de entrada y turno actual (para motos)
   - Calcula automáticamente el monto según las nuevas reglas
   - Indica si es tarifa por hora o por turno
   - Preview del monto antes de confirmar

3. **Cálculo Automático:**
   - Autos y camionetas: redondea hacia arriba por fracciones de 30 min
   - Motos: detecta cambios de turno y cobra por turno completo

### ✅ En la Página de Tarifas (`/tarifas`)

1. **Gestión Visual:**
   - Tarjetas individuales por tipo de vehículo
   - Edición en tiempo real
   - Preview de cálculo de ejemplo
   - Información de turnos configurados

2. **Validaciones:**
   - No permite precios negativos
   - Fracciones mínimas de 1 minuto
   - Guarda cambios con confirmación

---

## 🛠️ Estructura Técnica

### Base de Datos

**Tabla `tarifas`:**
- `tipo_vehiculo`: auto | camioneta | moto
- `precio_hora`: Decimal (precio por hora o por turno)
- `fraccion_minutos`: Integer (minutos de cada fracción)
- `es_por_turno`: Boolean (true para motos)
- `duracion_turno_horas`: Integer (8 horas para motos)

**Tabla `turnos`:**
- `nombre`: Texto (Mañana, Tarde, Noche)
- `hora_inicio`: Time (06:00, 14:00, 22:00)
- `hora_fin`: Time (14:00, 22:00, 06:00)
- `orden`: Integer (1, 2, 3)
- `activo`: Boolean

### Lógica de Cálculo

La función `calcularMonto()` en `src/pages/Ingresos.tsx`:

```typescript
// Para motos (por turno)
if (tipoVehiculo === 'moto' && tarifa.es_por_turno) {
  const turnoEntrada = getTurnoActual(fechaEntrada);
  const turnoSalida = getTurnoActual(fechaSalida);
  
  // Mismo día y mismo turno = 1 turno
  // Cambió de turno = calcular cuántos turnos pasaron
}

// Para autos y camionetas (por hora con fracciones)
const fracciones = Math.ceil(minutos / tarifa.fraccion_minutos);
const horas = fracciones * (tarifa.fraccion_minutos / 60);
return horas * tarifa.precio_hora;
```

---

## ⚠️ Notas Importantes

1. **Ingresos Anteriores:** Los vehículos que ya están estacionados mantendrán el cálculo con las tarifas antiguas hasta que salgan.

2. **Cambio en Vivo:** Una vez ejecutado el script SQL, las nuevas tarifas se aplican inmediatamente a los nuevos ingresos.

3. **Validación de Turnos:** El sistema detecta automáticamente en qué turno se encuentra según la hora del día.

4. **Redondeo:** Siempre se redondea hacia arriba para beneficio del estacionamiento.

---

## 🎯 Testing

Para probar las nuevas tarifas:

1. Registra una entrada de auto, espera 45 minutos, registra salida
2. Verifica que se cobren $2,000 (1 hora completa)
3. Registra una moto en turno de mañana, saca en el mismo turno
4. Verifica que se cobre $1,000
5. Registra una moto en un turno, saca en otro turno
6. Verifica que se cobren múltiples turnos

---

## 📞 Soporte

Si tienes algún problema con la actualización:

1. Verifica que el script SQL se ejecutó correctamente
2. Revisa la consola del navegador (F12) por errores
3. Verifica que la página de Tarifas muestre los valores correctos
4. Intenta refrescar la página con Ctrl+Shift+R

¡Listo! Tu sistema ahora usa las nuevas tarifas configuradas. 🎉

