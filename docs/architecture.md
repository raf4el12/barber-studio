# Arquitectura del Backend

**Última actualización:** 2026-06-15

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 (Express) |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| DB | PostgreSQL 16 (Docker) |
| Tiempo real | `@nestjs/websockets` + Socket.IO |
| Auth | JWT (`@nestjs/jwt`, `passport-jwt`) + bcrypt |
| Validación | `class-validator` + `class-transformer` |
| Tests | Jest (unit `*.spec.ts`, e2e `test/`) |

## Estructura de carpetas (objetivo)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts        # PrismaClient con adapter pg + middleware soft-delete
├── common/
│   ├── decorators/              # @CurrentUser, @Roles, @BranchScope
│   ├── guards/                  # JwtAuthGuard, RolesGuard
│   ├── interceptors/            # AuditInterceptor
│   └── dto/                     # paginación, filtros comunes
├── auth/                        # login, JWT strategy
├── branches/
├── users/
├── catalog/                     # services, service-categories, products
├── inventory/                   # inventory, stock-movements
├── commissions/                 # settings, commission-rules, resolver
├── queue/                       # queue + gateway WS
├── tickets/                     # tickets, ticket-items
├── payments/                    # payment-methods, payments, cash-registers
├── customers/                   # customers, loyalty
└── reports/                     # z-report, métricas
```

**Regla de organización**: un módulo NestJS por dominio. Lo que cambia junto, vive junto (controller + service + DTOs + spec en la misma carpeta). No separar por capa técnica.

## Capas dentro de un módulo

```
Controller  → valida DTO, extrae usuario/sucursal, delega. Sin lógica de negocio.
Service     → reglas de negocio, transacciones Prisma, cálculos de dinero.
Prisma      → acceso a datos. Sin lógica de negocio en queries crudas dispersas.
```

## Decisiones ya tomadas

- **Prisma 7**: la URL va en `apps/api/prisma.config.ts`, NO en el `datasource` del schema. En runtime `PrismaService` instancia `PrismaClient` con `@prisma/adapter-pg`. (Ver `CLAUDE.md` raíz.)
- **Multi-sucursal, no multi-tenant**: `Branch` es la raíz organizacional. Una empresa, una DB. Aislamiento por `branchId`, no por tenant.
- **Catálogo global / stock local**: `Service` y `Product` son compartidos entre sucursales; las existencias viven en `Inventory(branchId, productId)` y se mueven vía `StockMovement` (ledger).
- **Snapshots de venta**: `TicketItem` congela `unitPrice`, `taxRate/taxAmount` y `commissionType/Value/Amount` al momento de la venta — los reportes históricos no cambian si después se editan precios o reglas.
- **Métodos de pago configurables**: `PaymentMethod` es tabla, no enum. Permite agregar Tarjeta/Transferencia sin migración.

## Flujo de una venta (referencia)

1. Barbero crea `QueueEntry` (cola) → toma cliente → genera `Ticket` (status `OPEN`) con sus `TicketItem`.
2. Por cada ítem, el **servicio de comisiones** resuelve la regla aplicable y congela el monto en el `TicketItem`.
3. El ticket entra al POS vía WebSocket (`ticket.created`).
4. Cajero cobra: uno o varios `Payment` (pago dividido) ligados a la `CashRegister` abierta. Estado → `PARTIALLY_PAID` → `PAID`.
5. Al pagar: se descuenta stock (`StockMovement` tipo `SALE`), se acumulan puntos (`LoyaltyTransaction`) si hay cliente.
6. Al cierre: el **Z-Report** agrega `Payment` por método y suma comisión + propina por barbero.
