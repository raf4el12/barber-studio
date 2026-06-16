# Documentación — Barber Studio

| Documento | Contenido |
|-----------|-----------|
| [ROADMAP.md](ROADMAP.md) | Roadmap del backend: fases, dependencias, milestones |
| [architecture.md](architecture.md) | Stack, estructura de carpetas, decisiones técnicas |

## Planes por módulo (`docs/modules/`)

Ordenados por dependencia de construcción, no por número de negocio:

| # | Plan | Módulo de negocio |
|---|------|-------------------|
| 0 | [Fundación](modules/00-foundation.md) | Infra + Seguridad base (Mód. 6) |
| 1 | [Catálogo e Inventario](modules/01-catalog-inventory.md) | Mód. 4 |
| 2 | [Motor de Comisiones](modules/02-commissions.md) | Mód. 3 |
| 3 | [Cola en Tiempo Real](modules/03-queue-realtime.md) | Mód. 1 |
| 4 | [POS y Pagos](modules/04-pos-payments.md) | Mód. 2 |
| 5 | [Clientes y Fidelización](modules/05-customers-loyalty.md) | Mód. 5 (parte) |
| 6 | [Analítica y Cierres](modules/06-reports-closing.md) | Mód. 5 (parte) |
| 7 | [Auditoría y Seguridad](modules/07-security-audit.md) | Mód. 6 |

## Cómo ejecutar un plan

Cada plan tiene tareas en checkbox. Para implementarlo:
- `superpowers:subagent-driven-development` — un subagente por tarea con review (recomendado).
- `superpowers:executing-plans` — ejecución por lotes con checkpoints.
