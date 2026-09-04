/** Room de Socket.IO para todo lo operativo de una sucursal (cola + POS). */
export function branchRoom(branchId: string): string {
  return `branch:${branchId}`;
}
