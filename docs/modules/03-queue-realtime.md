# Fase 3 — Operaciones en Tiempo Real / Cola (Módulo 1)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.

**Goal:** Portal del barbero (PWA): cola de clientes en espera (general o asignada), y la base de "Mi Rendimiento" del turno actual.

**Architecture:** REST para mutaciones de cola + gateway WebSocket (Socket.IO) que emite cambios a las pantallas conectadas, segmentado por sucursal (rooms por `branchId`). "Mi Rendimiento" se deriva de tickets del barbero en el turno (se completa en Fase 4 cuando existan tickets).

**Tech Stack:** NestJS, `@nestjs/websockets`, Socket.IO, Prisma.

**Depende de:** Fase 0, Fase 1.

---

## Alcance

- CRUD de `QueueEntry` (crear, asignar barbero, cambiar estado, cerrar).
- Gateway WS: eventos `queue.updated` por sucursal.
- Endpoint "Mi Rendimiento" (placeholder de comisión hasta Fase 4).

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/queue?branchId=&status=` | BARBER, CASHIER | cola actual |
| POST | `/queue` | BARBER, CASHIER | añadir cliente (anónimo o `customerId`) |
| PATCH | `/queue/:id/assign` | BARBER, CASHIER | asignar barbero |
| PATCH | `/queue/:id/status` | BARBER, CASHIER | WAITING→IN_PROGRESS→COMPLETED/CANCELLED |
| GET | `/me/performance?branchId=` | BARBER | cortes del turno + estimado de comisión |

## Eventos WebSocket

| Evento | Payload | Cuándo |
|--------|---------|--------|
| `queue.updated` | `{ branchId, entries }` | alta/cambio/cierre de cualquier entrada de esa sucursal |

- Cliente se une a la room `branch:{branchId}` al conectar (con auth del token).

## Reglas de negocio

- `assignedBarberId = null` → cola general (cualquiera la toma). Asignar la mueve a la cola del barbero.
- Transiciones válidas: `WAITING → IN_PROGRESS → COMPLETED`; `WAITING/IN_PROGRESS → CANCELLED`. Rechazar saltos inválidos.
- "Mi Rendimiento" del turno = entradas `COMPLETED` del barbero desde la apertura de la `CashRegister` activa (o desde inicio del día si no hay caja).

## Tareas

- [ ] **`QueueModule`**: CRUD con validación de transición de estado.
- [ ] **`QueueGateway`**: rooms por sucursal; emitir `queue.updated` tras cada mutación (el service llama al gateway).
- [ ] **Auth en WS**: validar JWT en `handleConnection`; rechazar sin token.
- [ ] **`/me/performance`**: contar `COMPLETED` del barbero en el turno. La columna de comisión estimada queda en `0`/placeholder y se conecta al `CommissionResolverService` en Fase 4.

## Criterios de aceptación

- Crear entrada → todos los clientes en `branch:{id}` reciben `queue.updated`.
- Asignar barbero → la entrada aparece en su cola.
- Transición inválida (p.ej. `COMPLETED → WAITING`) → 400.
- WS sin token → conexión rechazada.

## Notas de prueba

- Unit: validador de transiciones de estado.
- E2E: cliente Socket.IO recibe el evento tras un POST a `/queue`.
