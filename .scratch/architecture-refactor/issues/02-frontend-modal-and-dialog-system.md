# 02 — Frontend Modal & Dialog System + Proof of Concept

**What to build:**
Construir el componente profundo `<Modal>` en `apps/web/src/components/ui/modal.tsx` con manejo de eventos de tecla `Escape`, backdrop blur animado, cabecera personalizable con icono y botón de cierre. Migrar `features/admin/inventory/movement-modal.tsx` y `threshold-modal.tsx` para usar este nuevo componente y los inputs del UI Kit, reduciendo el código repetitivo en un 60%.

**Blocked by:** 01 — Frontend Design System Foundation & Base UI Kit

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `apps/web/src/components/ui/modal.tsx` creado y accesible (cierre con tecla `Escape`, clic fuera del contenido, backdrop blur).
- [ ] `apps/web/src/features/admin/inventory/movement-modal.tsx` refactorizado para usar `<Modal>`, `<Input>`, `<Select>`, `<Button>`, y `<Alert>`.
- [ ] `apps/web/src/features/admin/inventory/threshold-modal.tsx` refactorizado para usar `<Modal>`, `<Input>`, y `<Button>`.
- [ ] La funcionalidad de registro de movimientos de inventario y actualización de stock mínimo opera exactamente igual sin regresiones funcionales.
- [ ] `pnpm --filter web lint` pasa sin advertencias.
