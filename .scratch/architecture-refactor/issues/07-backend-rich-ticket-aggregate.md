# 07 — Backend Rich Domain Aggregate: Ticket Aggregate

**What to build:**
Transformar la entidad anémica `TicketEntity` en un Agregado Rico de Dominio (`TicketAggregate`). Encapsular las reglas de negocio e invariantes dentro del agregado: máquina de estados (`canAcceptPayment`, `addPayment`, `applyDiscount`, `void`), cálculo de saldo adeudado (`balanceDue`), uso interno del Value Object `Money`, y validaciones de negocio. Refactorizar `AddPaymentUseCase`, `ApplyDiscountUseCase` y `VoidTicketUseCase` para delegar el cambio de estado al agregado en lugar de manipular propiedades planas.

**Blocked by:** 04 — Backend Shared Kernel: Money Value Object & Pure Domain Enums, 05 — Backend Decouple Domain Layers from Prisma

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `TicketAggregate` implementa métodos de negocio ricos: `registerPayment(...)`, `applyDiscount(...)`, `void(...)`, y cálculo de saldos con `Money`.
- [ ] Pruebas unitarias directas para `TicketAggregate` verificando invariantes (no sobrepago, no pago en ticket anulado, transición correcta a `PARTIALLY_PAID` y `PAID`).
- [ ] `AddPaymentUseCase` y `VoidTicketUseCase` reducen su complejidad orquestando el agregado en lugar de computar manualmente los estados.
- [ ] Todas las pruebas existentes de tickets y reportes siguen pasando (`pnpm --filter api test`).
