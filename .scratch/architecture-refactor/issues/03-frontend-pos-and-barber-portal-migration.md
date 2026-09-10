# 03 — Frontend POS & Barber Portal UI Migration

**What to build:**
Reemplazar los modales y controles ad-hoc en las vistas operativas de mayor criticidad (`features/pos` y `features/barber-portal`) utilizando el UI Kit profundo (`Modal`, `Button`, `Badge`, `Alert`, `Input`).

**Blocked by:** 02 — Frontend Modal & Dialog System + Proof of Concept

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `features/pos/checkout-modal.tsx` migrado a `<Modal>`, `<Button>`, `<Input>` y `<Badge>`.
- [ ] `features/pos/open-register-modal.tsx` y `close-register-modal.tsx` migrados al componente `<Modal>`.
- [ ] `features/pos/apply-discount-modal.tsx` migrado al componente `<Modal>`.
- [ ] `features/barber-portal/add-walkin-modal.tsx` y `create-ticket-modal.tsx` migrados al componente `<Modal>`.
- [ ] Se verifica que todos los flujos de cobro en POS, arqueo de caja y emisión de ticket en portal barbero funcionen idénticamente.
- [ ] `pnpm --filter web lint` y `pnpm --filter web build` completan con éxito.
