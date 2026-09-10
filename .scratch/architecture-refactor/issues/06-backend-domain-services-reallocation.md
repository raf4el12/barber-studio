# 06 — Backend Domain Services Reallocation: Commission Engine

**What to build:**
Reubicar el motor puro de comisiones `commission-resolver.service.ts` desde `commission-rules/application/services/` a `commission-rules/domain/services/` como un Domain Service genuino. Actualizar los puntos de llamada en `create-ticket.use-case.ts` y las pruebas correspondientes, respetando el seam del dominio.

**Blocked by:** 04 — Backend Shared Kernel: Money Value Object & Pure Domain Enums

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `CommissionResolverService` se ubica en `modules/commission-rules/domain/services/` y no depende de `@prisma/client`.
- [ ] Sus pruebas unitarias se trasladan a `domain/services/commission-resolver.service.spec.ts` y corren como lógica pura de dominio.
- [ ] `CreateTicketUseCase` y `PreviewCommissionUseCase` importan el servicio desde su nueva ubicación sin alterar el comportamiento.
- [ ] Todos los tests unitarios pasan (`pnpm --filter api test`).
