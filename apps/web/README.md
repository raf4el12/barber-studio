# Barber Studio — Frontend Web

Aplicación web cliente de **Barber Studio**, construida sobre **Next.js 16**, **React 19** y **Tailwind CSS 4**. Ofrece una interfaz moderna, reactiva y optimizada para pantallas táctiles y estaciones de trabajo de barberías, permitiendo la operación fluida de barberos, cajeros y administradores.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Detalle |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Servidor SSR / Client Components con convenciones de Next 16 |
| **Biblioteca UI** | React 19 | Hooks modernos, transiciones y renderizado optimizado |
| **Estilos** | Tailwind CSS 4 | Configuración moderna con `@tailwindcss/postcss` |
| **Iconografía** | Lucide React | Iconos vectoriales limpios y consistentes |
| **Tiempo Real** | Socket.IO Client | Conexión WebSocket al backend para actualización instantánea de colas y tickets |

---

## 🧭 Módulos y Rutas de la Aplicación

### 1. Autenticación y Acceso
- `/login`: Inicio de sesión con correo y contraseña. Incluye botón de acceso rápido con credenciales de prueba del seed.

### 2. Portal del Barbero (`/barber`)
- `/barber/queue`: Panel operativo para el barbero.
  - Cola en tiempo real (turnos generales y clientes que solicitaron barbero específico).
  - Transición de estados de atención: Esperando ➔ En Servicio ➔ Completado.
  - Creación y checkout rápido de tickets con servicios y productos.
  - Widget reactivo de *Mi Rendimiento* (comisiones y propinas acumuladas en el turno actual).

### 3. Estación de Caja y POS (`/pos`)
- `/pos`: Estación completa de punto de venta y caja registradora.
  - Visualización reactiva de tickets generados por los barberos en espera de cobro.
  - Pagos divididos (*Split Payment*): combinación de Efectivo, Yape, Plin y Tarjeta en una misma transacción.
  - Cálculo automático de vuelto, desglose de IGV y registro de propinas para el barbero.
  - Control de caja registradora: apertura con fondo inicial (*Opening Fund*) y cierre de turno con arqueo (*Cash Count*).

### 4. Backoffice Administrativo (`/admin`)
- `/admin/catalog`: Gestión integral de servicios de peluquería y categorías.
- `/admin/inventory`: Monitoreo de stock local por sucursal y registro de ajustes/kardex.
- `/admin/staff`: Cuentas de usuarios, asignación de roles (`OWNER`, `BARBER`, `CASHIER`) y administración de sucursales.
- `/admin/commissions`: Matriz de reglas de comisiones por servicio/producto, barbero o sucursal, con simulador en tiempo real.
- `/admin/customers`: Directorio unificado de clientes, historial de visitas y libro mayor de puntos de fidelización para canje.
- `/admin/reports`: Reportes analíticos, visualización y arqueo de Z-Report, liquidación de pagos a barberos (*Barber Payouts*) y métricas de negocio.

---

## 🚀 Puesta en Marcha

### 1. Variables de Entorno
Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Contenido de `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3100
NEXT_PUBLIC_WS_URL=http://localhost:3100
```

### 2. Ejecutar la Aplicación

Desde la raíz del monorepo o dentro de `apps/web`:

```bash
# Iniciar en modo desarrollo (escucha en http://localhost:3000)
pnpm dev

# Compilar para producción
pnpm build

# Ejecutar el build de producción
pnpm start

# Ejecutar linter
pnpm lint
```

---

## 🔑 Credenciales de Demostración (Seed)

Al iniciar por primera vez contra la base de datos con seed:
- **Usuario:** `owner@barber.studio`
- **Contraseña:** `password123`
- **Rol:** `OWNER` (acceso a todos los módulos y portales)
