# 04 — Backend Shared Kernel: Money Value Object & Pure Domain Enums

**What to build:**
Crear la capa de `Shared Kernel` del backend en `apps/api/src/common/domain/`. Construir el Value Object inmutable `Money` con operaciones aritméticas seguras (sin errores de coma flotante binaria) y pruebas unitarias exhaustivas con TDD. Definir enums nativos de TypeScript para todo el dominio (`TicketStatus`, `ItemType`, `CommissionType`, `QueueStatus`, `StockMovementType`, etc.), desacoplados de Prisma.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `apps/api/src/common/domain/value-objects/money.vo.ts` implementado como objeto inmutable con métodos: `add`, `subtract`, `multiply`, `equals`, `isGreaterThan`, `isZero`, `toNumber`, `toCents`, `fromCents`.
- [ ] Suite de pruebas unitarias exhaustiva para `Money` en `money.vo.spec.ts` cubriendo redondeos bancarios y límites.
- [ ] `apps/api/src/common/domain/enums/` contiene todos los enums del negocio puros (sin `@prisma/client`).
- [ ] Todos los tests unitarios existentes continúan pasando (`pnpm --filter api test`).
