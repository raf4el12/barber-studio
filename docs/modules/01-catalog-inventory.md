# Fase 1 — Catálogo e Inventario (Módulo 4)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.

**Goal:** Gestionar el catálogo compartido (servicios, categorías, productos) y el stock por sucursal con un ledger de movimientos auditable y alertas de bajo inventario.

**Architecture:** Catálogo global; existencias en `Inventory(branchId, productId)`. Todo cambio de stock pasa por `StockMovement` (nunca se edita `quantity` a mano fuera del servicio). Alertas derivadas comparando `quantity <= lowStockThreshold`.

**Tech Stack:** NestJS, Prisma, `class-validator`.

**Depende de:** Fase 0.

---

## Alcance

- CRUD `ServiceCategory`, `Service`, `Product` (con soft-delete).
- `Inventory` por sucursal; `StockMovement` ledger (compra, ajuste, transferencia, devolución).
- Endpoint de bajo stock.

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET/POST/PATCH/DELETE | `/service-categories` | OWNER | categorías de servicio |
| GET/POST/PATCH/DELETE | `/services` | OWNER | servicios y precios |
| GET/POST/PATCH/DELETE | `/products` | OWNER | productos (sku, precio, costo) |
| GET | `/inventory?branchId=` | OWNER, CASHIER | stock por sucursal |
| POST | `/inventory/movements` | OWNER, CASHIER | registra movimiento (ajusta `quantity` en transacción) |
| GET | `/inventory/low-stock?branchId=` | OWNER, CASHIER | productos en o bajo el umbral |

## Reglas de negocio

- Un `StockMovement` y la actualización de `Inventory.quantity` ocurren en **una misma transacción** Prisma (`$transaction`).
- `quantity` del movimiento lleva signo: entradas (+), salidas (−). El stock resultante no puede quedar negativo salvo ajuste explícito.
- Crear un `Product` no crea inventario automáticamente; se crea/upsertea `Inventory` la primera vez que entra stock en una sucursal.

## Tareas

- [x] **`CatalogModule`**: CRUD de `ServiceCategory` y `Service` con DTOs validados (`price >= 0`, `durationMinutes?` positivo). Soft-delete.
- [x] **`ProductsModule`**: CRUD de `Product` (`sku` único opcional, `cost?`). Soft-delete.
- [x] **`InventoryService.registerMovement()`**: en `$transaction`, crea `StockMovement` y hace `upsert` de `Inventory` sumando `quantity`. Lanza error si el resultado sería negativo y el tipo no es `ADJUSTMENT`.
- [x] **Listado de stock** por sucursal con join al producto.
- [x] **Endpoint low-stock**: `Inventory` donde `quantity <= lowStockThreshold`.

## Criterios de aceptación

- Crear producto → registrar `PURCHASE` de 10 → `Inventory.quantity == 10` y existe el `StockMovement`.
- Registrar `SALE` de 3 → `quantity == 7`.
- Intentar `SALE` de 100 sin ajuste → error, stock intacto.
- `low-stock` lista solo los que están en/bajo umbral.

## Notas de prueba

- Unit: `registerMovement` (suma correcta, bloqueo de negativo, transaccionalidad).
- E2E: producto → compra → venta → low-stock.
