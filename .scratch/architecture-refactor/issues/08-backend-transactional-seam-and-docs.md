# 08 — Backend Transactional Seam & Architecture Docs Synchronization

**What to build:**
Implementar una costura (*seam*) transaccional limpia para operaciones que cruzan límites de agregados (ej. pago de ticket + movimiento de stock + puntos de fidelidad en `AddPaymentUseCase`), asegurando atomicidad sin acoplar la capa de aplicación al cliente Prisma. Actualizar `docs/architecture.md` y `CLAUDE.md` para reflejar con precisión la arquitectura de capas actual, sus principios de diseño y guías para futuros módulos.

**Blocked by:** 05 — Backend Decouple Domain Layers from Prisma, 07 — Backend Rich Domain Aggregate: Ticket Aggregate

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] Mecanismo o helper transaccional disponible para casos de uso que requieren atomicidad multi-repositorio.
- [ ] `AddPaymentUseCase` ejecuta la creación del pago, la actualización del ticket y el movimiento de stock dentro de una misma transacción atómica.
- [ ] `docs/architecture.md` actualizado por completo: documentación de la estructura de 4 capas (`domain`, `application`, `infrastructure`, `interfaces`), reglas de no-contaminación de Prisma, uso de `Money` y componentes UI.
- [ ] `pnpm --filter api test` y `pnpm --filter api lint` pasan al 100%.
