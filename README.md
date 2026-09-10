# 💈 Barber Studio

> **Plataforma integral de gestión operativa, comercial y fidelización para cadenas de barberías y salones de estética masculina.**

Barber Studio es una solución monorepo modular diseñada para resolver las operaciones críticas de una barbería moderna: gestión de colas de atención en tiempo real, punto de venta (POS) con pagos divididos, cálculo automático e inmutable de comisiones para barberos, control de inventario local con kardex, directorio de clientes con billetera de puntos de fidelización, y cierres de turno con arqueo ciego (Z-Report).

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura del Monorepo](#-arquitectura-del-monorepo)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Puesta en Marcha Rápida](#-puesta-en-marcha-rápida)
- [Credenciales de Demostración](#-credenciales-de-demostración)
- [Scripts del Proyecto](#-scripts-del-proyecto)
- [Principios de Diseño y Arquitectura](#-principios-de-diseño-y-arquitectura)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Documentación Adicional](#-documentación-adicional)

---

## ✨ Características Principales

### 💈 1. Portal del Barbero y Cola en Tiempo Real
- **Cola Reactiva:** Visualización instantánea de clientes en espera mediante WebSockets (Socket.IO), diferenciando entre la cola general y clientes que solicitaron un barbero específico.
- **Transición de Turnos:** Flujo ágil de estados (*Esperando* ➔ *En Servicio* ➔ *Completado* / *Cancelado*).
- **Emisión Rápida de Tickets:** Registro directo de servicios realizados y productos de reventa entregados al cliente.
- **Mi Rendimiento en Vivo:** Widget interactivo que muestra las comisiones y propinas acumuladas por el barbero durante el turno activo.

### 💳 2. Punto de Venta (POS) y Gestión de Caja
- **Recepción Reactiva:** Los tickets creados por los barberos se sincronizan automáticamente con la estación de caja sin recargar.
- **Pagos Divididos (*Split Payment*):** Liquidación de una misma cuenta combinando Efectivo, Yape, Plin y Tarjeta.
- **Propinas y Vuelto:** Desglose del vuelto en efectivo y atribución directa de propinas al barbero correspondiente.
- **Arqueo y Cierre de Turno:** Apertura obligatoria con fondo inicial (*Opening Fund*), registro de ventas y arqueo ciego (*Cash Count*) al cierre con generación de **Z-Report**.

### 📦 3. Catálogo e Inventario Multi-Sucursal
- **Catálogo Unificado:** Gestión centralizada de servicios (con duración y precio base) y productos retail (con código SKU único y control de precio de venta).
- **Stock Local por Sucursal:** Control de existencias físicas independiente por cada sede.
- **Kardex Inmutable:** Todo ingreso, merma, transferencia o venta genera un registro en el libro mayor de movimientos (`StockMovement`), garantizando trazabilidad total.

### 📈 4. Motor Jerárquico de Comisiones
- **Resolución por Prioridad:** Cálculo jerárquico de comisiones basado en reglas configurables (Global ➔ Por Sucursal ➔ Por Categoría ➔ Por Barbero ➔ Por Servicio/Producto específico).
- **Congelamiento Inmutable (`CommissionSnapshot`):** Al emitir un ticket, el porcentaje y monto exacto de la comisión se congelan. Si las reglas o precios cambian en el futuro, los reportes históricos permanecen inalterables.

### 👥 5. Personal y Sedes (Multi-Sucursal & RBAC)
- **Aislamiento por Sede:** Cada transacción operativa se vincula a una sucursal (`BranchScope`).
- **Control de Acceso por Roles (RBAC):** Permisos diferenciados para `OWNER` (acceso y configuración global), `BARBER` (operaciones de servicio y rendimiento propio) y `CASHIER` (estación POS y arqueo de caja).
- **Registro de Auditoría (`AuditLog`):** Registro cronológico inmutable de cambios de estado, anulaciones y transacciones financieras críticas.

### 🎁 6. Directorio de Clientes y Fidelización
- **Registro Unificado de Clientes:** Búsqueda rápida por nombre, teléfono o documento, e historial detallado de tickets y visitas.
- **Billetera de Puntos:** Acumulación automática de puntos calculada sobre el subtotal del ticket y registrada en un ledger inmutable (`LoyaltyLedger`).
- **Canje en Vivo:** Aplicación de descuentos y cortesías en el checkout del POS mediante el consumo de puntos acumulados.

### 📊 7. Cierres de Turno (Z-Report), Liquidación y Analítica
- **Z-Report Consolidado:** Conciliación total por medio de pago (efectivo, Yape, Plin, tarjeta), cálculo de discrepancias en arqueo y balance neto.
- **Liquidación a Barberos (*Barber Payouts*):** Desglose transparente de comisiones devengadas por ítems más propinas directas acumuladas.
- **Métricas de Negocio:** Reportes de tickets emitidos, ticket promedio, servicios más demandados e ingresos por sucursal y rango de fechas.

---

## 🏗️ Arquitectura del Monorepo

El proyecto está configurado como un monorepo gestionado con **pnpm workspaces**:

```
barber-studio/
├── apps/
│   ├── api/          # Backend NestJS 11 + Prisma 7 + PostgreSQL 16 (Puerto 3100)
│   └── web/          # Frontend Next.js 16 + React 19 + Tailwind CSS 4 (Puerto 3000)
├── docs/             # Arquitectura, Roadmap técnico y especificaciones por fase
│   ├── modules/      # Planes de implementación detallados (Fases 00 a 12)
│   ├── ROADMAP.md    # Hoja de ruta de dependencias técnicas
│   └── architecture.md # Decisiones y diseño de capas backend
├── CONTEXT.md        # Modelo de dominio y glosario del negocio
├── docker-compose.yml# Infraestructura de persistencia local (PostgreSQL 16)
├── package.json      # Scripts orquestadores del monorepo
└── pnpm-workspace.yaml
```

---

## 🛠️ Stack Tecnológico

| Capa | Herramienta | Versión / Detalle |
|---|---|---|
| **Backend Framework** | [NestJS](https://nestjs.com/) | `v11.x` — Módulos DDD, Dependency Injection, Validation Pipes |
| **ORM** | [Prisma](https://www.prisma.io/) | `v7.8` — Driver adapter `@prisma/adapter-pg` desacoplado |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/) | `16-alpine` — Desplegado en contenedor Docker |
| **Frontend Framework** | [Next.js](https://nextjs.org/) | `v16.2` — App Router, Server / Client Components |
| **Biblioteca UI** | [React](https://react.dev/) | `v19.2` — Hooks modernos y transiciones de estado |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) | `v4.x` — Motor optimizado con `@tailwindcss/postcss` |
| **Iconos** | [Lucide React](https://lucide.dev/) | `v1.43` — Iconos vectoriales accesibles y ligeros |
| **Comunicación en Tiempo Real** | [Socket.IO](https://socket.io/) | `v4.8` — WebSockets para sincronización de cola y tickets |
| **Autenticación** | Passport JWT & bcrypt | Tokens JWT con guards globales y hashing de contraseñas |
| **Testing** | [Jest](https://jestjs.io/) | Pruebas unitarias (`*.spec.ts`) y de integración E2E |
| **Gestor de Paquetes** | [pnpm](https://pnpm.io/) | Monorepo con soporte de workspaces y caché eficiente |

---

## 📋 Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas en tu entorno de desarrollo:

- **Node.js**: `v20.x` o superior (compatible con `v26.x`).
- **pnpm**: `v9.x` o superior (`npm install -g pnpm`).
- **Docker** y **Docker Compose**: Para la base de datos PostgreSQL.
- **Bun** *(opcional)*: Para la ejecución en paralelo de ambas aplicaciones con `pnpm dev`.

---

## 🚀 Puesta en Marcha Rápida

Sigue estos pasos para tener el entorno de desarrollo funcionando desde cero:

### 1. Clonar el Repositorio e Instalar Dependencias

```bash
git clone https://github.com/raf4el12/barber-studio.git
cd barber-studio
pnpm install
```

### 2. Configurar Variables de Entorno

Configura el backend:
```bash
cp apps/api/.env.example apps/api/.env
```

Configura el frontend:
```bash
cp apps/web/.env.example apps/web/.env.local
```

### 3. Iniciar la Base de Datos con Docker

```bash
docker compose up -d
```
> Esto levantará un contenedor con PostgreSQL 16 escuchando en el puerto estándar `5432`.

### 4. Ejecutar Migraciones y Seed Inicial de Prisma

```bash
# Aplicar esquema en PostgreSQL
pnpm --filter api exec prisma migrate dev

# Cargar sucursal principal, usuario dueña, métodos de pago y settings base
pnpm --filter api exec prisma db seed
```

### 5. Iniciar la Aplicación

Puedes iniciar ambos servicios en paralelo:

```bash
pnpm dev
```

O en terminales independientes:

```bash
# Terminal 1: Backend API (http://localhost:3100)
pnpm dev:api

# Terminal 2: Frontend Web (http://localhost:3000)
pnpm dev:web
```

Una vez iniciados:
- **Frontend:** Abre tu navegador en [http://localhost:3000](http://localhost:3000).
- **Backend API:** Disponible en [http://localhost:3100](http://localhost:3100).

---

## 🔑 Credenciales de Demostración

El comando de seed precarga una cuenta con rol de propietario (`OWNER`) lista para usar:

| Campo | Valor |
|---|---|
| **Correo Electrónico** | `owner@barber.studio` |
| **Contraseña** | `password123` |
| **Rol** | `OWNER` (acceso a todos los portales y vistas) |
| **Sucursal Asignada** | Sucursal Principal |

> En la pantalla de login (`/login`), dispones de un botón de acceso rápido para rellenar estas credenciales en un solo clic.

---

## 💻 Scripts del Proyecto

Los siguientes comandos pueden ejecutarse desde la raíz del monorepo:

### Desarrollo y Ejecución
```bash
# Iniciar frontend y backend en paralelo
pnpm dev

# Iniciar únicamente la API
pnpm dev:api
# o: pnpm --filter api start:dev

# Iniciar únicamente la aplicación Web
pnpm dev:web
# o: pnpm --filter web dev
```

### Base de Datos y Prisma
```bash
# Ejecutar migraciones pendientes
pnpm --filter api exec prisma migrate dev

# Regenerar el cliente de Prisma
pnpm --filter api exec prisma generate

# Poblar la base de datos (Seed)
pnpm --filter api exec prisma db seed

# Abrir el explorador visual de datos de Prisma Studio
pnpm --filter api exec prisma studio
```

### Pruebas y Calidad de Código
```bash
# Ejecutar pruebas unitarias del backend
pnpm --filter api test

# Ejecutar pruebas end-to-end (E2E) del backend
pnpm --filter api test:e2e

# Ejecutar linters
pnpm --filter api lint
pnpm --filter web lint
```

---

## 📐 Principios de Diseño y Arquitectura

1. **Aislamiento Multi-Sucursal (`BranchScope`)**:
   El sistema está diseñado bajo el principio de *una sola empresa, múltiples sucursales físicas*. Salvo el rol `OWNER`, las consultas y mutaciones operativas se aíslan rigurosamente por `branchId`.
2. **Inmutabilidad de Registros Contables y de Stock**:
   Las ventas, pagos, descuentos de existencias y transacciones de puntos funcionan como libros mayores (*ledgers*) de sólo adición (`append-only`). Las correcciones se procesan mediante anulación formal y contra-asientos, preservando la trazabilidad contable.
3. **Precisión Numérica en Moneda**:
   Todos los cálculos monetarios (precios, subtotales, IGV, comisiones y propinas) se representan mediante tipos decimales precisos (`Prisma.Decimal`), evitando errores de coma flotante binaria.
4. **Prisma 7 Desacoplado**:
   La URL de conexión a la base de datos se gestiona en `apps/api/prisma.config.ts`, manteniendo el esquema agnóstico del origen de conexión y empleando el driver adapter `@prisma/adapter-pg` en tiempo de ejecución.
5. **Next.js 16 Modern Standards**:
   Uso exclusivo de convenciones del App Router de Next.js 16, aprovechando Server Components para carga optimizada y Client Components reactivos para la interacción del barbero y la caja.

---

## 📚 Documentación Adicional

En la carpeta [`docs/`](docs/) encontrarás documentación arquitectónica y funcional detallada:

- 📖 [docs/README.md](docs/README.md) — Índice maestro de la documentación técnica.
- 🗺️ [docs/ROADMAP.md](docs/ROADMAP.md) — Fases de implementación, dependencias técnicas y milestones del proyecto.
- 🏛️ [docs/architecture.md](docs/architecture.md) — Arquitectura interna del backend, convención de capas y flujos de venta.
- 📖 [CONTEXT.md](CONTEXT.md) — Glosario ubicuo y vocabulario estricto del dominio.
- 📋 [docs/modules/](docs/modules/) — Especificaciones funcionales y técnicas de cada fase construida (Fases 00 a 12).

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para Barber Studio.
