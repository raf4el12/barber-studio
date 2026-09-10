# 01 — Frontend Design System Foundation & Base UI Kit

**What to build:**
Establecer los cimientos del Design System reutilizable en el frontend (`apps/web`). Instalar dependencias para fusión determinista de clases Tailwind (`clsx`, `tailwind-merge`), crear utilidades de formateo (`cn`, `formatCurrency`, `formatDate`), y los componentes atómicos base (`Button`, `Input`, `Select`, `Badge`, `Alert`).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `clsx` y `tailwind-merge` instalados en `apps/web`.
- [ ] `apps/web/src/lib/utils.ts` exporta la función `cn(...)`.
- [ ] `apps/web/src/lib/formatters.ts` exporta `formatCurrency` (formato Soles `S/ 0.00`), `formatDate` y `formatTime`.
- [ ] `apps/web/src/components/ui/button.tsx` soporta variantes `primary`, `secondary`, `danger`, `ghost` y tamaños `sm`, `md`, `lg`, con estado de carga `loading`.
- [ ] `apps/web/src/components/ui/input.tsx` y `select.tsx` implementan estética uniforme (fondo `zinc-800/80`, borde `zinc-700`, foco ámbar) y muestran mensajes de error.
- [ ] `apps/web/src/components/ui/badge.tsx` soporta variantes de color semánticas (`success`, `warning`, `danger`, `neutral`, `info`).
- [ ] `apps/web/src/components/ui/alert.tsx` renderiza alertas accesibles con icono automático según variante (`error`, `warning`, `success`, `info`).
- [ ] El comando `pnpm --filter web lint` pasa sin errores.
