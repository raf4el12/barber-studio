# Fase 4 — POS y Flujo de Caja (Módulo 2)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.
> **Milestone M2 — Venta de punta a punta.** Es la fase de mayor valor.

**Goal:** Generar tickets (portal barbero), recibirlos reactivamente en el POS y cobrarlos con pago dividido, IGV y propina, descontando stock y congelando la comisión.

**Architecture:** Al crear el ticket, el service calcula por línea: descuento, IGV (`tax_rate` del setting) y comisión (vía `CommissionResolverService` de Fase 2), y **congela** todo como snapshot en `TicketItem`. Pagos múltiples por ticket ligados a la `CashRegister` abierta. El gateway emite `ticket.created`/`ticket.paid` al POS.

**Tech Stack:** NestJS, Prisma `$transaction`, Socket.IO, `Prisma.Decimal`.

**Depende de:** Fase 1 (catálogo/stock), Fase 2 (comisiones/settings), Fase 3 (cola/WS).

---

## Alcance

- Apertura/cierre de `CashRegister`.
- Creación de `Ticket` + `TicketItem` con snapshots (precio, IGV, comisión).
- `PaymentMethod` (gestión) + `Payment` con **pago dividido**.
- Anulación de ticket (estado `VOIDED`, sin borrar).
- Recepción reactiva en POS (WS).

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET/POST/PATCH | `/payment-methods` | OWNER | métodos configurables |
| POST | `/cash-registers/open` | CASHIER, OWNER | abre caja con fondo inicial |
| POST | `/cash-registers/:id/close` | CASHIER, OWNER | arqueo: efectivo contado |
| GET | `/cash-registers/active?branchId=` | CASHIER, OWNER | caja abierta |
| POST | `/tickets` | BARBER | crea ticket con ítems (calcula snapshots) |
| GET | `/tickets?branchId=&status=` | CASHIER, OWNER | cola del POS |
| POST | `/tickets/:id/payments` | CASHIER, OWNER | registra un pago (parcial o total) |
| PATCH | `/tickets/:id/discount` | CASHIER, OWNER | descuento manual |
| POST | `/tickets/:id/void` | OWNER | anula ticket |

## Eventos WebSocket

| Evento | Cuándo |
|--------|--------|
| `ticket.created` | barbero genera ticket → aparece en el POS |
| `ticket.paid` | ticket totalmente pagado |
| `ticket.voided` | ticket anulado |

## Reglas de negocio (cálculo del ticket)

Por cada `TicketItem` al crear el ticket, en una `$transaction`:
1. `lineBase = unitPrice * quantity`.
2. `discountAmount` (si aplica a la línea).
3. `taxAmount = (lineBase - discountAmount) * taxRate / 100` con `taxRate = Setting tax_rate`.
4. `lineTotal = lineBase - discountAmount + taxAmount`.
5. `commission* = CommissionResolverService.resolve(barber, item, now)` → congelado.

Totales del ticket = suma de líneas (`subtotal`, `discountAmount`, `taxAmount`, `total`). `tipAmount` se agrega al cobrar.

**Pagos:**
- Cada `Payment` referencia la `CashRegister` activa de la sucursal. Sin caja abierta → 400.
- `sum(payments.amount) < total + tip` → estado `PARTIALLY_PAID`. Al alcanzar el total → `PAID`, set `paidAt`.
- Sobrepago → 400 (o vuelto manejado por el cajero fuera del sistema).
- Al pasar a `PAID`: por cada `TicketItem` de tipo `PRODUCT`, registrar `StockMovement` tipo `SALE` (Fase 1) en la misma transacción.

**Anulación:** solo OWNER; `VOIDED` con `voidedAt`; revierte stock si ya estaba pagado (contra-asiento `RETURN`). Queda en auditoría (Fase 7).

## Tareas

- [x] **`PaymentMethodsModule`**: CRUD; no permitir borrar uno con pagos (desactivar con `isActive=false`).
- [x] **`CashRegistersModule`**: abrir (una activa por sucursal), cerrar con `closingCountedCash`.
- [x] **`TicketsService.create()`**: `$transaction` que calcula snapshots por línea (descuento + IGV + comisión) y totales; estado `OPEN`; emite `ticket.created`.
- [x] **`TicketsService.addPayment()`**: valida caja activa, suma pagos, actualiza estado; al completar descuenta stock y emite `ticket.paid`.
- [x] **Descuento manual** y **anulación** con sus reglas.
- [x] **Conectar "Mi Rendimiento"** (Fase 3): sumar `commissionAmount` de los tickets `PAID` del barbero en el turno.

## Criterios de aceptación

- Ticket con 1 servicio (S/30) + 1 producto (S/10), IGV 18% → totales correctos y comisión congelada por línea.
- Pago dividido: S/20 efectivo + resto Yape → estado pasa `PARTIALLY_PAID` → `PAID`.
- Al pagar, el stock del producto baja y existe el `StockMovement SALE`.
- Cobrar sin caja abierta → 400.
- Anular ticket pagado → `VOIDED` + reversa de stock.

## Notas de prueba

- Unit: cálculo de totales por línea (con/ sin descuento, con IGV), máquina de estados de pago.
- E2E: flujo cola → ticket → pago dividido → `PAID`; verificar stock y evento WS.
