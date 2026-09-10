# 05 — Backend Decouple Domain Layers from Prisma

**What to build:**
Reemplazar todos los imports de `@prisma/client` en las carpetas `src/modules/*/domain/` por los nuevos enums y tipos puros de dominio. Incorporar mappers o adaptaciones en los repositorios de `infrastructure/persistence/` para que Prisma quede confinado exclusivamente a la capa de infraestructura.

**Blocked by:** 04 — Backend Shared Kernel: Money Value Object & Pure Domain Enums

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] Ningún archivo dentro de `src/modules/*/domain/` o `src/common/domain/` importa desde `@prisma/client`.
- [ ] Los repositorios de infraestructura mapean los enums y entidades de dominio hacia/desde los tipos generados por Prisma.
- [ ] La suite completa de 172 tests unitarios (`pnpm --filter api test`) pasa al 100% sin roturas.
- [ ] `pnpm --filter api lint` completa exitosamente.
