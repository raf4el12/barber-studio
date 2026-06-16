# Fase 0 — Fundación (Infra + Seguridad base)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`. Pasos en checkbox para tracking.

**Goal:** Dejar el backend con base de datos conectada, autenticación JWT, control de acceso por rol y datos semilla, para que las siguientes fases construyan dominio sobre terreno firme.

**Architecture:** `PrismaService` global con adapter `pg`. Auth con JWT + bcrypt. `RolesGuard` lee `@Roles()` y `JwtAuthGuard` protege rutas. Middleware Prisma para soft-delete. Seed idempotente.

**Tech Stack:** NestJS 11, Prisma 7, `@prisma/adapter-pg`, `pg`, `@nestjs/jwt`, `passport-jwt`, `bcrypt`, `class-validator`.

**Depende de:** —

---

## Alcance

- Conexión Prisma (adapter) + migración inicial + seed.
- Módulos `auth`, `users`, `branches`.
- `JwtAuthGuard`, `RolesGuard`, decoradores `@CurrentUser()`, `@Roles()`.
- Middleware soft-delete (excluir `deletedAt != null`).

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/auth/login` | público | email + password → `{ accessToken }` |
| GET | `/auth/me` | autenticado | perfil del usuario actual |
| GET/POST/PATCH | `/branches` | OWNER | gestión de sucursales |
| GET/POST/PATCH | `/users` | OWNER | gestión de staff (asigna rol y sucursal) |

## Tareas

- [ ] **Instalar dependencias**: `pnpm --filter api add @prisma/adapter-pg pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer` y los `@types/*`.
- [ ] **Migración inicial**: `pnpm --filter api exec prisma migrate dev --name init` (con Docker DB arriba). Verificar tablas creadas.
- [ ] **`PrismaService`**: extiende `PrismaClient` con `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`; `onModuleInit` → `$connect`. Exportar en `PrismaModule` global.
- [ ] **Middleware soft-delete**: en lecturas `findMany/findFirst` de modelos con `deletedAt`, inyectar `where: { deletedAt: null }`; "delete" se traduce a `update { deletedAt: now }`.
- [ ] **`AuthModule`**: `POST /auth/login` valida con bcrypt y firma JWT (`sub`, `role`, `branchId`). `JwtStrategy` valida y carga el usuario.
- [ ] **Guards y decoradores**: `JwtAuthGuard` (global salvo `@Public()`), `RolesGuard` + `@Roles(Role.OWNER)`, `@CurrentUser()` que expone `{ id, role, branchId }`.
- [ ] **`BranchesModule` y `UsersModule`**: CRUD con validación; crear usuario hashea password.
- [ ] **Seed** (`prisma/seed.ts`): 1 sucursal, 1 usuario OWNER, métodos de pago `CASH/YAPE/PLIN`, settings `commission_base_percentage=40` y `tax_rate=18`. Idempotente (`upsert`).

## Criterios de aceptación

- `prisma migrate dev` corre limpio y `prisma studio` muestra las tablas.
- Login devuelve token; ruta protegida sin token → 401; con rol incorrecto → 403.
- Re-ejecutar el seed no duplica filas.
- Borrar un servicio lo marca `deletedAt` y deja de aparecer en listados.

## Notas de prueba

- Unit: `AuthService.login` (password correcto/incorrecto), `RolesGuard` (permite/deniega).
- E2E: flujo login → `/auth/me` → acceso a `/branches` con OWNER vs BARBER.
