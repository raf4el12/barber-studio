# Fase 5 — Clientes y Fidelización (Módulo 5, parte)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.

**Goal:** Registro de clientes con historial de visitas y un sistema de puntos de fidelización (acumulación y canje) sobre un ledger inmutable.

**Architecture:** `Customer` enlazado a `Ticket`/`QueueEntry`. Los puntos NO se guardan como número editable; `loyaltyPoints` es un cache derivado del ledger `LoyaltyTransaction`. Acumulación automática al pagar un ticket con cliente.

**Tech Stack:** NestJS, Prisma `$transaction`.

**Depende de:** Fase 4 (tickets pagados disparan acumulación).

---

## Alcance

- CRUD de `Customer` (soft-delete).
- Acumulación de puntos al pagar (hook en `TicketsService.addPayment`).
- Canje de puntos (descuento o premio).
- Historial de visitas y de puntos.

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET/POST/PATCH/DELETE | `/customers` | OWNER, CASHIER | gestión de clientes |
| GET | `/customers/:id/history` | OWNER, CASHIER | tickets del cliente |
| GET | `/customers/:id/loyalty` | OWNER, CASHIER | ledger de puntos + saldo |
| POST | `/customers/:id/loyalty/redeem` | OWNER, CASHIER | canje (puntos negativos + motivo) |

## Reglas de negocio

- **Acumulación**: al marcar un ticket `PAID` con `customerId`, crear `LoyaltyTransaction` con `points = floor(total / factor)`. `factor` configurable vía `Setting` (`loyalty_points_per_currency`).
- **Saldo**: `loyaltyPoints` se recalcula como `sum(LoyaltyTransaction.points)` dentro de la misma transacción que crea el asiento (mantener cache y ledger consistentes).
- **Canje**: valida saldo suficiente; crea asiento negativo con `reason`. No permitir saldo negativo.
- Acumulación y canje siempre en `$transaction` (asiento + actualización de cache).

## Tareas

- [x] **`CustomersModule`**: CRUD con DTOs (`phone`/`email` opcionales, únicos suaves a nivel app si se desea). Soft-delete.
- [x] **`LoyaltyService.accrue(customerId, ticket)`**: crea asiento + actualiza cache; invocado desde Fase 4 al pagar.
- [x] **`LoyaltyService.redeem(customerId, points, reason)`**: valida saldo, crea asiento negativo.
- [x] **Historial**: tickets del cliente ordenados por fecha; ledger de puntos con saldo corrido.

## Criterios de aceptación

- Pagar ticket de S/50 con `factor=10` → cliente gana 5 puntos y el ledger lo refleja.
- Canjear 5 puntos → saldo 0, asiento negativo registrado.
- Canjear más de lo disponible → 400.
- Borrar cliente (soft) → no aparece en listados, su historial se conserva.

## Notas de prueba

- Unit: `accrue` (cálculo de puntos), `redeem` (bloqueo por saldo insuficiente), consistencia cache↔ledger.
