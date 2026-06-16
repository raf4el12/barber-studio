# Fase 7 — Auditoría y Seguridad transversal (Módulo 6)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.
> **Milestone M4 — Producción.**

**Goal:** Registrar acciones críticas en `AuditLog` y endurecer el control de acceso por rol y sucursal en todo el backend.

**Architecture:** Un `AuditInterceptor` captura mutaciones marcadas con `@Audit('ACTION')` y escribe en `AuditLog` (usuario, sucursal, entidad, metadata). El aislamiento por sucursal se centraliza en un guard/decorador `@BranchScope` que valida que un usuario no-OWNER solo opere sobre su `branchId`.

**Tech Stack:** NestJS interceptors/guards, Prisma.

**Depende de:** Fase 0, Fase 4 (acciones a auditar).

---

## Alcance

- `AuditLog` automático sobre acciones críticas.
- Endpoint de consulta de auditoría (solo OWNER).
- Endurecimiento RBAC + aislamiento por sucursal.

## Acciones a auditar (mínimo)

| Acción | Disparador |
|--------|-----------|
| `TICKET_VOIDED` | anulación de ticket |
| `COMMISSION_RULE_CHANGED` | crear/editar/borrar regla de comisión |
| `SETTING_CHANGED` | cambio de configuración (incl. IGV, % comisión) |
| `STOCK_ADJUSTED` | `StockMovement` tipo `ADJUSTMENT` |
| `CASH_REGISTER_CLOSED` | cierre de caja |
| `LOYALTY_REDEEMED` | canje de puntos |
| `USER_ROLE_CHANGED` | cambio de rol/sucursal de un usuario |

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/audit-logs?entityType=&userId=&from=&to=` | OWNER | consulta filtrable del log |

## Reglas de negocio

- El interceptor registra **después** de una mutación exitosa; no audita lecturas.
- `metadata` guarda el diff o los valores relevantes (p.ej. `{ before, after }` del % de comisión).
- **Aislamiento**: usuarios `BARBER`/`CASHIER` solo acceden a datos de su `branchId`; `OWNER` puede pasar `branchId` explícito. El guard rechaza cross-branch con 403.

## Tareas

- [ ] **`@Audit('ACTION')` + `AuditInterceptor`**: lee el decorador, arma el registro con `@CurrentUser()` y el resultado, escribe en `AuditLog`.
- [ ] **Decorar** los endpoints críticos de la tabla anterior.
- [ ] **`BranchScopeGuard`**: valida coherencia de `branchId` para roles no-OWNER en todos los módulos operativos.
- [ ] **`GET /audit-logs`**: consulta paginada y filtrable.
- [ ] **Revisión de seguridad**: ejecutar `/security-review` sobre el diff acumulado.

## Criterios de aceptación

- Anular un ticket crea un `AuditLog TICKET_VOIDED` con usuario y metadata.
- Cambiar el % de comisión registra `before`/`after`.
- Un CASHIER intentando leer datos de otra sucursal → 403.
- El log es consultable y filtrable solo por OWNER.

## Notas de prueba

- Unit: interceptor (arma el registro correcto), `BranchScopeGuard` (permite misma sucursal, deniega otra).
- E2E: acción crítica → aparece en `/audit-logs`.
