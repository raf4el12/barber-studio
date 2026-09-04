export interface TicketLineInput {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate: number;
}

export interface TicketLineResult {
  lineBase: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface TicketTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Redondeo monetario del borde (2 decimales). */
export function roundMoney(value: number): number {
  return round2(value);
}

/**
 * Totales por línea. Funciones puras: el IGV se calcula sobre
 * (base − descuento) y todo se redondea a 2 decimales en el borde.
 */
export function calculateLine(input: TicketLineInput): TicketLineResult {
  const lineBase = round2(input.unitPrice * input.quantity);
  const discountAmount = round2(input.discountAmount ?? 0);
  const taxAmount = round2(((lineBase - discountAmount) * input.taxRate) / 100);
  return {
    lineBase,
    discountAmount,
    taxAmount,
    lineTotal: round2(lineBase - discountAmount + taxAmount),
  };
}

export function calculateTotals(
  lines: Pick<TicketLineResult, 'lineBase' | 'discountAmount' | 'taxAmount'>[],
  ticketDiscount: number,
): TicketTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.lineBase, 0));
  const discountAmount = round2(ticketDiscount);
  const taxAmount = round2(
    lines.reduce((sum, line) => sum + line.taxAmount, 0),
  );
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total: round2(subtotal - discountAmount + taxAmount),
  };
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Correlativo legible del ticket: T-AAAAMMDD-XXXX. */
export function buildTicketCode(at: Date = new Date()): string {
  const date = at.toISOString().slice(0, 10).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `T-${date}-${suffix}`;
}
