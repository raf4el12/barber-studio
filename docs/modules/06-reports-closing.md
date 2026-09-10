# Fase 6 — Analítica y Cierres (Módulo 5, parte)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.
> **Milestone M3 — Cierre de día.** Demo a la dueña.

**Goal:** Cierre de caja diario (Z-Report) que cuadra ingresos por método de pago y calcula el pago a cada barbero (comisión + propina), más métricas de rendimiento del negocio.

**Architecture:** Reportes de solo lectura derivados de los ledgers (`Payment`, `TicketItem`, `CashRegister`). Sin tablas nuevas: todo se agrega con queries (`groupBy`) sobre datos inmutables. El Z-Report toma una `CashRegister` cerrada (o rango de fechas) como ámbito.

**Tech Stack:** NestJS, Prisma `groupBy`/agregaciones.

**Depende de:** Fase 4 (pagos/tickets), Fase 5 (clientes para métricas).

---

## Alcance

- Z-Report por `CashRegister` (o por día/sucursal).
- Desglose de pago a barberos (comisión + propina).
- Métricas: días de mayor afluencia, barberos más productivos, servicios más solicitados.

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/reports/z-report?cashRegisterId=` | OWNER, CASHIER | arqueo de la sesión de caja |
| GET | `/reports/z-report?branchId=&date=` | OWNER | arqueo por día |
| GET | `/reports/barber-payouts?branchId=&from=&to=` | OWNER | comisión + propina por barbero |
| GET | `/reports/metrics?branchId=&from=&to=` | OWNER | afluencia, top barberos, top servicios |

## Contenido del Z-Report

- **Ingresos por método**: `Payment.groupBy(paymentMethodId)` dentro del ámbito → `{ Efectivo, Yape, Plin, ... }`.
- **Efectivo esperado vs contado**: `openingAmount + ventas en efectivo` vs `closingCountedCash` → diferencia (sobrante/faltante).
- **Pago a barberos**: por barbero, `sum(TicketItem.commissionAmount)` de tickets `PAID` en el ámbito `+ sum(Ticket.tipAmount)` de sus tickets.
- **Totales**: tickets cobrados, IGV recaudado, descuentos otorgados.

## Reglas de negocio

- Solo cuenta tickets `PAID` (no `OPEN`/`VOIDED`).
- El ámbito por `cashRegisterId` usa los `Payment` ligados a esa caja; por día/sucursal usa `paidAt` y `branchId`.
- Las propinas se pagan al barbero del ticket, separadas de la comisión.

## Tareas

- [x] **`ReportsModule`** (solo lectura, sin entidades nuevas).
- [x] **`ZReportService.build(scope)`**: agrega ingresos por método, calcula efectivo esperado vs contado, y el payout por barbero. Devuelve un DTO estructurado.
- [x] **`barber-payouts`**: agregación de comisión + propina por barbero en un rango.
- [x] **`metrics`**: `groupBy` por día (afluencia), por barbero (productividad), por servicio (más solicitados).

## Criterios de aceptación

- Con 2 pagos efectivo + 1 Yape, el Z-Report separa los montos correctamente.
- `closingCountedCash` distinto a lo esperado → reporta la diferencia con signo.
- Payout de un barbero = suma de comisiones congeladas + propinas de sus tickets pagados.
- Tickets anulados no afectan ningún total.

## Notas de prueba

- Unit: agregaciones del Z-Report con un set fijo de tickets/pagos → cifras esperadas.
- E2E: abrir caja → ventas variadas → cerrar → Z-Report cuadra.
