# Barber Studio — API Backend

Servicio backend de **Barber Studio**, desarrollado con **NestJS 11**, **Prisma 7** y **PostgreSQL 16**. Provee una API REST modular, autenticación y autorización basada en roles (RBAC) con aislamiento multi-sucursal, eventos en tiempo real mediante WebSockets (Socket.IO) y persistencia inmutable para operaciones críticas (kardex de inventario, tickets de venta y puntos de fidelización).

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Detalle |
|---|---|---|
| **Framework** | NestJS 11 | Arquitectura modular basada en DDD (Domain-Driven Design) |
| **ORM** | Prisma 7 | Driver adapter nativo `@prisma/adapter-pg` y configuración desacoplada |
| **Base de Datos** | PostgreSQL 16 | Contenerizada con Docker, precisión `Decimal` para importes |
| **Tiempo Real** | Socket.IO (`@nestjs/websockets`) | Notificaciones reactivas de cola, tickets y caja |
| **Autenticación** | JWT (`@nestjs/jwt`, `passport-jwt`) | Tokens cifrados con bcrypt y guards globales |
| **Validación** | `class-validator` + `class-transformer` | Validación estricta DTO en cada endpoint con whitelist |
| **Testing** | Jest + Supertest | Tests unitarios (`*.spec.ts`) y de integración E2E (`test/`) |

---

## 📁 Estructura de Módulos (`src/modules/`)

Cada módulo encapsula su controlador, servicio, DTOs y pruebas unitarias:

- `auth`: Registro, login, emisión de JWT y Passport Strategy.
- `branches`: Gestión de sucursales físicas (raíz del aislamiento multi-sucursal).
- `users`: Cuentas de personal (`OWNER`, `BARBER`, `CASHIER`) con hash bcrypt.
- `service-categories`: Categorías del catálogo de servicios.
- `services`: Servicios de corte y estética masculina con duración y precio base.
- `products`: Catálogo de productos retail con SKU único.
- `inventory`: Existencias por sucursal y libro mayor (`StockMovement`) inmutable.
- `commission-rules`: Reglas de comisiones jerárquicas con vigencias y prioridades.
- `settings`: Parámetros globales y específicos por sucursal (ej. % de comisión base, IGV).
- `queue`: Cola de atención en tiempo real (turnos generales y asignados) + Gateway WebSocket.
- `tickets`: Tickets de venta con congelamiento inmutable de comisiones e impuestos (`CommissionSnapshot`).
- `payment-methods`: Medios de pago configurables (Efectivo, Yape, Plin, Tarjeta).
- `cash-registers`: Sesiones de caja por turno, control de apertura, cobros y arqueos.
- `reports`: Z-Report consolidado de cierre de turno y cálculo de liquidación a barberos.
- `customers`: Clientes y libro mayor de puntos de fidelización (`LoyaltyLedger`).
- `audit`: Registro cronológico inmutable de auditoría para operaciones sensibles.

---

## 🚀 Puesta en Marcha

### 1. Requisitos
- Node.js >= 20
- Docker & Docker Compose
- pnpm >= 9

### 2. Variables de Entorno
Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Contenido base:
```env
PORT=3100
DATABASE_URL="postgresql://postgres:password@localhost:5432/barber_studio?schema=public"
JWT_SECRET="dev-change-me-in-production"
JWT_EXPIRES_IN="1d"
```

### 3. Base de Datos y Migraciones

```bash
# Iniciar contenedor PostgreSQL
docker compose up -d

# Ejecutar migraciones de Prisma
pnpm exec prisma migrate dev

# Cargar datos iniciales (Seed: sucursal, dueña, medios de pago, settings)
pnpm exec prisma db seed
```

### 4. Ejecutar el Servidor

```bash
# Modo desarrollo con auto-reload (escucha en http://localhost:3100)
pnpm start:dev

# Modo producción
pnpm build
pnpm start:prod
```

---

## 🧪 Pruebas Automatizadas

```bash
# Tests unitarios
pnpm test

# Tests en modo observación
pnpm test:watch

# Cobertura de código
pnpm test:cov

# Tests de integración E2E
pnpm test:e2e
```

---

## ⚠️ Consideraciones de Prisma 7

Este proyecto utiliza **Prisma 7**. Ten en cuenta las siguientes características:
- La URL de conexión **no** reside en el bloque `datasource` de `schema.prisma`.
- La conexión se gestiona en `prisma.config.ts` mediante `dotenv`.
- En runtime, `PrismaService` inicializa `PrismaClient` utilizando el driver adapter `@prisma/adapter-pg`.
- Todas las eliminaciones de entidades críticas implementan **soft-delete** (`deletedAt`).
