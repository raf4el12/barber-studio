# SDD Spec: Refactorización Arquitectónica y Normalización (Clean Architecture, DDD & UI Design System)

**Estado:** `ready-for-agent`  
**Metodología:** Matt Pocock Engineering Skills (`codebase-design`, `domain-modeling`, `to-spec`, `to-tickets`)  
**Fecha:** 2026-09-09  

---

## 1. Problem Statement

El repositorio `barber-studio` cuenta con una suite sólida de 172 pruebas unitarias y módulos funcionales completos. Sin embargo, sufre de **fricción arquitectónica y deuda de duplicación** en ambos niveles:

1. **Frontend (`apps/web`)**: No existe una capa reutilizable de componentes de UI. Cada modal, formulario, botón, badge y tabla vuelve a escribir 30-50 líneas de Tailwind crudo repetitivo. Esto rompe el principio de **localidad**: cambiar el diseño de un modal o un botón requiere editar decenas de archivos en `features/pos`, `features/barber-portal` y `features/admin`.
2. **Backend (`apps/api`)**:
   - **Modelo de Dominio Anémico**: Las entidades en `domain/entities` son simples contenedores de datos (`class TicketEntity { id!: string; ... }`) sin comportamiento ni invariantes.
   - **Fuga de Abstracción (Leaky Abstraction)**: La capa de `domain/` importa enums y tipos directamente de `@prisma/client`, haciendo que el corazón del negocio dependa de la base de datos.
   - **Falta de Shared Kernel**: Lógica transversal (cálculo monetario con 2 decimales, tipos de dinero, enums puros, clases base de agregados) está dispersa o reinventada con tipos primitivos (`number`).
   - **Orquestación Acoplada y Falta de Atomicidad Transaccional**: Casos de uso como `AddPaymentUseCase` coordinan hasta 5 módulos/repositorios mediante llamadas asíncronas separadas sin una costura (*seam*) transaccional atómica (Unit of Work).
   - **Desfase Documental**: `docs/architecture.md` describe una arquitectura plana de 3 capas (`Controller -> Service -> Prisma`), contradiciendo la estructura real de carpetas en `src/modules/*`.

---

## 2. Solution

Implementar una refactorización guiada por **módulos profundos (*deep modules*)** y **costuras limpias (*seams*)**, aplicando el patrón **Expand–Contract** para que los 172 tests unitarios actuales se mantengan siempre en verde:

1. **Frontend**:
   - Construir un **Design System / UI Kit** profundo en `apps/web/src/components/ui/` (`Button`, `Input`, `Select`, `Modal`, `Badge`, `Alert`, `Card`, `Table`, `EmptyState`) apoyado en `lib/utils.ts` (`cn`) y `lib/formatters.ts`.
   - Reemplazar progresivamente el JSX duplicado en `features/` por estos módulos profundos con alto apalancamiento (*leverage*).
2. **Backend**:
   - **Shared Kernel (`common/domain/`)**: Crear el objeto de valor inmutable `Money`, enums de dominio nativos desacoplados de Prisma, y excepciones de dominio.
   - **Mapeadores de Infraestructura (`infrastructure/mappers/`)**: Introducir mappers que traduzcan entre filas de Prisma y entidades/agregados de dominio.
   - **Agregados Ricos**: Enriquecer `Ticket`, `QueueEntry` y `CashRegister` con métodos que protejan sus invariantes y máquinas de estado (`addPayment`, `void`, `close`).
   - **Servicios de Dominio Puros**: Reubicar `CommissionResolverService` en `domain/services/`.
   - **Unidad de Trabajo / Seam Transaccional**: Proveer una abstracción limpia para que operaciones multi-repositorio (pago + stock + puntos) sean atómicas.
   - **Sincronización de Documentación**: Actualizar `docs/architecture.md` para plasmar fielmente el estándar arquitectónico.

---

## 3. User Stories

1. **Como desarrollador frontend**, quiero importar un componente `<Modal isOpen={...} onClose={...} title="...">` reutilizable, para no tener que duplicar 60 líneas de divs, animaciones y backdrops en cada nueva funcionalidad.
2. **Como desarrollador frontend**, quiero utilizar componentes `<Button>`, `<Input>` y `<Select>` con variantes de estilo consistentes, para que toda la aplicación mantenga una identidad visual homogénea y accesible.
3. **Como desarrollador frontend**, quiero disponer de utilidades como `formatCurrency(amount)` y `cn(...)` en `lib/`, para evitar inconsistencias en el formateo de Soles (`S/`) y errores de concatenación de clases Tailwind.
4. **Como desarrollador backend**, quiero que las entidades de dominio contengan sus métodos de negocio (ej. `ticket.registerPayment(amount)`), para que las reglas de negocio e invariantes no se rompan ni se dispersen por múltiples casos de uso.
5. **Como desarrollador backend**, quiero que la capa de `domain/` tenga cero dependencias de `@prisma/client`, para que el núcleo de negocio sea 100% testeable en memoria y agnóstico de la infraestructura.
6. **Como desarrollador backend**, quiero usar un Value Object `Money` que encapsule el redondeo a 2 decimales y operaciones aritméticas seguras, para erradicar errores de coma flotante y redondeos manuales repetitivos.
7. **Como desarrollador backend**, quiero que el registro de un pago con descuento de inventario y acumulación de puntos sea atómico, para evitar inconsistencias contables si una operación intermedia falla.
8. **Como nuevo ingeniero en el proyecto**, quiero que `docs/architecture.md` coincida exactamente con la estructura y convenciones del código, para navegar y extender el sistema sin fricción cognitiva.

---

## 4. Implementation Decisions

### A. Frontend: Shared UI Components (Deep Modules)
- **Tecnología base:** `clsx` y `tailwind-merge` para resolver colisiones de clases en Tailwind CSS 4 mediante la función `cn(...)`.
- **Ubicación:** `apps/web/src/components/ui/`.
- **Catálogo inicial de componentes:**
  - `button.tsx`: Variantes `primary` (ámbar), `secondary` (zinc-800), `danger` (rojo), `ghost`. Tamaños `sm`, `md`, `lg`.
  - `input.tsx`: Input estilizado con soporte de `label`, `error`, `icon` e indicador de obligatorio.
  - `select.tsx`: Select con soporte para opciones y estados de foco/error consistentes.
  - `modal.tsx`: Diálogo accesible con backdrop blur, botón de cierre, cabecera flexible con soporte de icono y animación de entrada.
  - `badge.tsx`: Variantes semánticas (`success`, `warning`, `danger`, `neutral`, `info`).
  - `alert.tsx`: Bloque de alerta con variantes `error`, `warning`, `success`, `info`.
  - `card.tsx`: Contenedor modular (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`).
  - `table.tsx`: Tabla estilizada (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
- **Migración de features:** Proceso expand-contract: crear primero el catálogo, luego migrar por módulos (`pos`, `inventory`, `barber-portal`, `reports`).

### B. Backend: Shared Kernel & Value Objects
- **Ubicación:** `apps/api/src/common/domain/`.
- **Value Object `Money`:**
  - Inmutable.
  - Operaciones: `add()`, `subtract()`, `multiply(factor)`, `isGreaterThan()`, `isZero()`.
  - Almacena valor numérico con 2 decimales fijos (`Math.round(val * 100) / 100`).
  - Formateo integrado: `toPENString()`.
- **Enums de Dominio Desacoplados:**
  - Crear enums en TypeScript nativo: `TicketStatus`, `ItemType`, `CommissionType`, `QueueStatus`, `StockMovementType`, `UserRole`.
  - Reemplazar imports de `@prisma/client` en `domain/` por estos enums nativos.
- **Mapeo en Repositorios:**
  - Los repositorios de persistencia (`PrismaTicketRepository`, etc.) actúan como adaptadores que mapean entre los tipos de Prisma y los tipos puros de dominio.

### C. Backend: Domain Aggregates & Services
- **Módulo Piloto (`tickets`):**
  - Transformar `TicketEntity` en un **Agregado Rico (`TicketAggregate`)**.
  - Métodos del agregado:
    - `addPayment(payment: PaymentInput): { isPaid: boolean; newTipTotal: Money; balanceDue: Money }`
    - `applyDiscount(discount: DiscountInput): void`
    - `voidTicket(): void`
  - Reubicar `commission-resolver.service.ts` a `modules/commission-rules/domain/services/commission-resolver.domain-service.ts`.
- **Casos de uso limpios:**
  - Los casos de uso delegan la lógica matemática y de transición de estados al agregado, reduciendo su complejidad ciclomática.

---

## 5. Testing Decisions

- **Preservación estricta de la suite existente:** Los 172 tests unitarios (`pnpm --filter api test`) deben mantenerse en verde durante cada fase.
- **Pruebas en la costura más alta posible:**
  - Los Value Objects se prueban exhaustivamente con pruebas unitarias puras (sin mocks).
  - Los Agregados de dominio se prueban mediante métodos de negocio (caja negra a nivel de clase), verificando estados resultantes e invariantes.
  - Los casos de uso se prueban contra fakes/mocks de repositorios de dominio.
- **Pruebas de UI Frontend:** Verificación de renderizado de componentes base y pruebas de no-regresión visual e interactiva en los modales migrados.

---

## 6. Out of Scope

- Cambios en el esquema de base de datos PostgreSQL (`schema.prisma`) o nuevas migraciones SQL (la persistencia actual es válida y suficiente).
- Reescritura del motor de WebSockets o cambio de bibliotecas de transporte.
- Reemplazo de Next.js App Router o NestJS por otros frameworks.

---

## 7. Further Notes

Se aplicará la estrategia **Expand–Contract** de Matt Pocock para evitar refactorizaciones traumáticas ("big bang"):
1. **Expand:** Crear los nuevos componentes y abstracciones compartidas en paralelo al código existente sin romper los puntos de llamada.
2. **Migrate:** Migrar un módulo a la vez (primero `tickets` en backend y `pos/inventory` en frontend), verificando la suite de tests tras cada paso.
3. **Contract:** Eliminar código duplicado y tipos obsoletos una vez que todos los consumidores utilicen la nueva arquitectura.
