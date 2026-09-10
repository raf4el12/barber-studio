# 💈 Master Tracker: Refactorización Arquitectónica Barber Studio

**Especificación:** [`spec.md`](./spec.md) | [docs/architecture-refactor-sdd.md](../../docs/architecture-refactor-sdd.md)  
**Metodología:** Matt Pocock Engineering Skills (`codebase-design`, `domain-modeling`, `to-spec`, `to-tickets`, `tdd`)  
**Suite Base:** 172 tests unitarios pasando al 100% (`pnpm --filter api test`)

---

## 📊 Estado de los Tickets

| # | Ticket | Track | Estado | Bloqueado por | Entregable Clave |
|---|---|---|---|---|---|
| **01** | [01-frontend-design-system-foundation.md](./issues/01-frontend-design-system-foundation.md) | Frontend | `ready-for-agent` | *None (Frontier)* | `clsx`, `tailwind-merge`, `cn`, `formatCurrency`, `Button`, `Input`, `Select`, `Badge`, `Alert` |
| **02** | [02-frontend-modal-and-dialog-system.md](./issues/02-frontend-modal-and-dialog-system.md) | Frontend | `ready-for-agent` | 01 | Componente `<Modal>` profundo y refactor de modales de inventario |
| **03** | [03-frontend-pos-and-barber-portal-migration.md](./issues/03-frontend-pos-and-barber-portal-migration.md) | Frontend | `ready-for-agent` | 02 | Migración de modales de POS y Portal del Barbero a UI Kit |
| **04** | [04-backend-shared-kernel-money-and-enums.md](./issues/04-backend-shared-kernel-money-and-enums.md) | Backend | `ready-for-agent` | *None (Frontier)* | Value Object `Money` (TDD) + Enums nativos de Dominio |
| **05** | [05-backend-decouple-domain-from-prisma.md](./issues/05-backend-decouple-domain-from-prisma.md) | Backend | `ready-for-agent` | 04 | Cero imports de `@prisma/client` en capas `domain/` |
| **06** | [06-backend-domain-services-reallocation.md](./issues/06-backend-domain-services-reallocation.md) | Backend | `ready-for-agent` | 04 | Reubicación de `CommissionResolverService` a `domain/services/` |
| **07** | [07-backend-rich-ticket-aggregate.md](./issues/07-backend-rich-ticket-aggregate.md) | Backend | `ready-for-agent` | 04, 05 | Agregado `TicketAggregate` rico (máquina de estados, invariantes) |
| **08** | [08-backend-transactional-seam-and-docs.md](./issues/08-backend-transactional-seam-and-docs.md) | Backend | `ready-for-agent` | 05, 07 | Seam transaccional atómico + sincronización de `docs/architecture.md` |

---

## 📋 Lista de Verificación (Checklist de Progreso)

### Track Frontend
- [ ] **Ticket 01**: Frontend Design System Foundation & Base UI Kit
  - [ ] Instalar `clsx` y `tailwind-merge` en `apps/web`
  - [ ] Crear `apps/web/src/lib/utils.ts` con helper `cn(...)`
  - [ ] Crear `apps/web/src/lib/formatters.ts` con `formatCurrency` (`S/ 0.00`), `formatDate`
  - [ ] Crear `apps/web/src/components/ui/button.tsx`
  - [ ] Crear `apps/web/src/components/ui/input.tsx` y `select.tsx`
  - [ ] Crear `apps/web/src/components/ui/badge.tsx`
  - [ ] Crear `apps/web/src/components/ui/alert.tsx`
- [ ] **Ticket 02**: Frontend Modal & Dialog System + PoC
  - [ ] Crear `apps/web/src/components/ui/modal.tsx`
  - [ ] Refactorizar `features/admin/inventory/movement-modal.tsx`
  - [ ] Refactorizar `features/admin/inventory/threshold-modal.tsx`
- [ ] **Ticket 03**: Frontend POS & Barber Portal UI Migration
  - [ ] Refactorizar `features/pos/checkout-modal.tsx`
  - [ ] Refactorizar `features/pos/open-register-modal.tsx` y `close-register-modal.tsx`
  - [ ] Refactorizar `features/pos/apply-discount-modal.tsx`
  - [ ] Refactorizar `features/barber-portal/add-walkin-modal.tsx` y `create-ticket-modal.tsx`

### Track Backend
- [ ] **Ticket 04**: Backend Shared Kernel: Money VO & Pure Enums
  - [ ] Implementar Value Object `Money` con TDD en `common/domain/value-objects/`
  - [ ] Definir enums nativos de TypeScript en `common/domain/enums/`
  - [ ] Validar que los 172 tests unitarios pasen en verde
- [ ] **Ticket 05**: Backend Decouple Domain Layers from Prisma
  - [ ] Reemplazar imports de `@prisma/client` en capas `domain/`
  - [ ] Adaptar repositorios de infraestructura con mappers
  - [ ] Verificar 172 tests unitarios pasando al 100%
- [ ] **Ticket 06**: Backend Domain Services Reallocation
  - [ ] Mover `CommissionResolverService` a `modules/commission-rules/domain/services/`
  - [ ] Actualizar puntos de llamada en casos de uso de comisiones y tickets
- [ ] **Ticket 07**: Backend Rich Domain Aggregate: Ticket Aggregate
  - [ ] Crear `TicketAggregate` con métodos de negocio e invariantes protegidas
  - [ ] Refactorizar `AddPaymentUseCase`, `ApplyDiscountUseCase`, `VoidTicketUseCase`
  - [ ] Pruebas unitarias de agregado y casos de uso en verde
- [ ] **Ticket 08**: Backend Transactional Seam & Architecture Docs
  - [ ] Implementar seam transaccional atómico multi-módulo
  - [ ] Actualizar `docs/architecture.md` y `CLAUDE.md`
