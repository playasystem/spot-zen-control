# 🚗 Spot Zen Control

Sistema de gestión de estacionamiento para playa de autos y motos.

## 🌟 Características

- ✅ Dashboard en tiempo real con mapa de lugares
- ✅ Gestión de clientes (mensuales y por hora)
- ✅ Control de ingresos y salidas de vehículos
- ✅ Cálculo automático de tarifas
- ✅ Reportes y estadísticas
- ✅ Gestión de pagos mensuales
- ✅ Alertas de vencimientos

## 🛠️ Tecnologías

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Estado**: React Query (TanStack Query)

## 🚀 Instalación Local

### Requisitos previos
- Node.js v18 o superior
- Cuenta en Supabase

### Paso 1: Clonar el repositorio

```bash
git clone <YOUR_GIT_URL>
cd spot-zen-control
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://mepnlxiqryetwtquogae.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_api_key_aqui
```

### Paso 4: Configurar Supabase

⚠️ **IMPORTANTE**: Debes ejecutar las migraciones en Supabase para crear las tablas.

Lee el archivo **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** para instrucciones detalladas.

**Resumen rápido:**
1. Ve al SQL Editor de tu proyecto Supabase
2. Ejecuta el archivo `supabase/migrations/20251022143903_a06e2d80-e1da-4be9-a048-dcdce22391b6.sql`
3. Crea un usuario en Authentication → Users

### Paso 5: Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:8080` (o el puerto que Vite asigne).

## 📂 Estructura del Proyecto

```
spot-zen-control/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/          # Componentes de UI (shadcn)
│   │   ├── Navbar.tsx   # Barra de navegación
│   │   └── ProtectedRoute.tsx
│   ├── contexts/        # Contextos de React
│   │   └── AuthContext.tsx
│   ├── integrations/    # Integraciones externas
│   │   └── supabase/    # Cliente y tipos de Supabase
│   ├── pages/           # Páginas principales
│   │   ├── Auth.tsx     # Login/Registro
│   │   ├── Dashboard.tsx    # Dashboard principal
│   │   ├── Clientes.tsx     # Gestión de clientes
│   │   ├── Ingresos.tsx     # Control de ingresos/salidas
│   │   └── Reportes.tsx     # Reportes y estadísticas
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Punto de entrada
├── supabase/
│   └── migrations/      # Migraciones de base de datos
└── public/              # Archivos estáticos
```

## 🗄️ Base de Datos

### Tablas principales:

- **clientes**: Información de clientes
- **vehiculos**: Patentes y datos de vehículos
- **lugares**: Espacios de estacionamiento (12 autos + 14 motos)
- **ingresos**: Registros de entrada/salida
- **pagos**: Pagos de clientes mensuales
- **tarifas**: Precios por tipo de vehículo

### Tarifas por defecto:
- Auto: $2,000/hora
- Moto: $1,000/hora
- Camioneta: $2,500/hora

## 🎯 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa del build
npm run preview

# Linter
npm run lint
```

## 🔐 Autenticación

El sistema utiliza Supabase Auth. Solo usuarios autenticados pueden acceder a la aplicación.

Para crear un usuario:
1. Ve a tu proyecto en Supabase
2. Authentication → Users → Add user
3. Ingresa email y contraseña

## 🐛 Troubleshooting

### El mapa de lugares no se ve

1. Verifica que las migraciones se hayan ejecutado
2. Ejecuta esta consulta en Supabase SQL Editor:
   ```sql
   SELECT COUNT(*) FROM lugares;
   ```
3. Si devuelve 0, ejecuta el archivo `supabase/seed.sql`

### Error de permisos

Asegúrate de estar autenticado y que las políticas RLS estén creadas (incluidas en la migración).

### Variables de entorno no se cargan

Verifica que el archivo `.env` esté en la raíz del proyecto y que las variables comiencen con `VITE_`.

## 📚 Documentación Adicional

- [Configuración de Supabase](./SETUP_SUPABASE.md)
- [shadcn-ui](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)

## 📝 Licencia

Este proyecto es privado y propietario.

---

Desarrollado con ❤️ para Spot Zen
