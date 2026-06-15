# Fase 2 — Motor de Comisiones (Módulo 3)

> **Para ejecutar:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans`.

**Goal:** Resolver, para cualquier ítem vendido por un barbero, qué comisión le corresponde, según una jerarquía de reglas configurable (global → sucursal → barbero → servicio/categoría/producto) con prioridad y vigencia.

**Architecture:** `CommissionRule` con ámbito opcional (barbero/servicio/categoría/producto/sucursal), `priority` y rango de fechas. Un `CommissionResolverService` recibe `(barber, item, fecha)` y devuelve `{ type, value, amount }`. Es el corazón reutilizado por la Fase 4 al congelar el snapshot.

**Tech Stack:** NestJS, Prisma. Lógica pura testeable.

**Depende de:** Fase 0, Fase 1.

---

## Alcance

- CRUD de `Setting` (global y por sucursal).
- CRUD de `CommissionRule`.
- `CommissionResolverService` — núcleo de cálculo (sin efectos secundarios).

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET/PUT | `/settings?branchId=` | OWNER | leer/actualizar configuración (incluye `commission_base_percentage`, `tax_rate`) |
| GET/POST/PATCH/DELETE | `/commission-rules` | OWNER | reglas de excepción |
| POST | `/commission-rules/preview` | OWNER | simula la resolución para `(barberId, serviceId/productId, fecha)` |

## Algoritmo de resolución (orden de precedencia)

Para un ítem (servicio o producto), barbero y fecha:

1. Filtrar `CommissionRule` **activas** y **vigentes** (`startsAt/endsAt` cubren la fecha, o son null) cuyo ámbito coincide:
   - `branchId` = sucursal del ticket **o** null.
   - `barberId` = barbero **o** null.
   - Para servicios: `serviceId` = servicio, o `serviceCategoryId` = su categoría, o ambos null.
   - Para productos: `productId` = producto, o null.
2. Puntuar cada regla por **especificidad** (cuántos campos de ámbito no-null coinciden) y desempatar por `priority` (mayor gana).
3. Si hay regla ganadora → usar su `type` y `value`.
4. Si NO hay regla → fallback: `User.commissionRate` (si existe) como `PERCENTAGE`; si no, `Setting commission_base_percentage` (de la sucursal, o global) como `PERCENTAGE`.
5. Calcular `amount`:
   - `PERCENTAGE` → `lineTotalBaseComision * value / 100`.
   - `FIXED` → `value * quantity`.

> **Base de la comisión**: se calcula sobre el importe del ítem **antes de descuento e impuesto** salvo que se decida lo contrario. Documentar la elección en un `Setting` (`commission_base = "pre_tax"`).

## Tareas

- [ ] **`SettingsService`**: `get(key, branchId?)` con fallback a global; `set(key, value, branchId?)` vía `upsert` sobre `@@unique([branchId, key])`.
- [ ] **`CommissionRulesModule`**: CRUD con DTOs (`type ∈ {PERCENTAGE, FIXED}`, `value >= 0`, validación de rango de fechas).
- [ ] **`CommissionResolverService.resolve(input)`**: implementa el algoritmo anterior. Función **pura** sobre datos cargados (recibe reglas candidatas + settings), fácil de testear.
- [ ] **Endpoint preview**: expone el resolver para que la dueña valide reglas antes de aplicarlas.

## Criterios de aceptación

- Sin reglas, barbero sin override → usa `commission_base_percentage`.
- Barbero con `commissionRate=50` → usa 50% sobre el global.
- Regla `FIXED S/5` para producto "cera" → vende 3 ceras → comisión `15`.
- Dos reglas que aplican: gana la de mayor especificidad; a igual especificidad, mayor `priority`.
- Regla con `endsAt` pasado → no aplica.

## Notas de prueba

- Unit (foco): tabla de casos del resolver — cada rama del algoritmo con su `amount` esperado. Es el módulo con mayor densidad de tests.
