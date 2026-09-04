import { Injectable } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import type { CommissionRuleEntity } from '../../domain/entities/commission-rule.entity';

export interface ResolveCommissionInput {
  /** Reglas candidatas ya cargadas (el repositorio las entrega, el resolver filtra). */
  rules: CommissionRuleEntity[];
  /** Fecha de la venta. Por defecto, ahora. */
  at?: Date;
  /** Sucursal del ticket. null = sin sucursal (solo aplican reglas globales). */
  branchId: string | null;
  barberId: string;
  serviceId?: string | null;
  serviceCategoryId?: string | null;
  productId?: string | null;
  /** Unidades vendidas del ítem (>= 1). */
  quantity: number;
  /** Precio unitario pre-impuesto y pre-descuento (base de la comisión). */
  unitPrice: number;
  /** Override del barbero (User.commissionRate). null = sin override. */
  barberCommissionRate?: number | null;
  /** Setting commission_base_percentage efectivo (sucursal o global). */
  basePercentage: number;
}

export interface ResolvedCommission {
  type: CommissionType;
  value: number;
  /** Monto redondeado a 2 decimales. */
  amount: number;
  /** Regla ganadora, o null si se usó el fallback. */
  ruleId: string | null;
}

/**
 * Núcleo del motor de comisiones. Función pura: sin DB, sin efectos.
 * La Fase 4 (POS) la reutiliza para congelar el snapshot en cada TicketItem.
 */
@Injectable()
export class CommissionResolverService {
  resolve(input: ResolveCommissionInput): ResolvedCommission {
    const at = input.at ?? new Date();
    const quantity = input.quantity;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('La cantidad debe ser un entero mayor a cero');
    }

    const winner = this.findWinningRule(input, at);
    if (winner) {
      return {
        type: winner.type,
        value: winner.value,
        amount: this.calculateAmount(
          winner.type,
          winner.value,
          quantity,
          input.unitPrice,
        ),
        ruleId: winner.id,
      };
    }

    const fallbackRate = input.barberCommissionRate ?? input.basePercentage;
    return {
      type: CommissionType.PERCENTAGE,
      value: fallbackRate,
      amount: this.calculateAmount(
        CommissionType.PERCENTAGE,
        fallbackRate,
        quantity,
        input.unitPrice,
      ),
      ruleId: null,
    };
  }

  private findWinningRule(
    input: ResolveCommissionInput,
    at: Date,
  ): CommissionRuleEntity | null {
    const candidates = input.rules.filter((r) => this.matches(r, input, at));
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const bySpecificity = this.specificity(b) - this.specificity(a);
      if (bySpecificity !== 0) return bySpecificity;
      const byPriority = b.priority - a.priority;
      if (byPriority !== 0) return byPriority;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    return candidates[0];
  }

  private matches(
    rule: CommissionRuleEntity,
    input: ResolveCommissionInput,
    at: Date,
  ): boolean {
    if (!rule.isActive) return false;
    if (rule.startsAt && rule.startsAt > at) return false;
    if (rule.endsAt && rule.endsAt < at) return false;
    if (rule.branchId !== null && rule.branchId !== input.branchId)
      return false;
    if (rule.barberId !== null && rule.barberId !== input.barberId)
      return false;

    if (input.productId) {
      if (rule.serviceId !== null || rule.serviceCategoryId !== null)
        return false;
      if (rule.productId !== null && rule.productId !== input.productId)
        return false;
      return true;
    }
    if (rule.productId !== null) return false;
    if (rule.serviceId !== null && rule.serviceId !== input.serviceId)
      return false;
    if (
      rule.serviceCategoryId !== null &&
      rule.serviceCategoryId !== input.serviceCategoryId
    ) {
      return false;
    }
    return true;
  }

  private specificity(rule: CommissionRuleEntity): number {
    return [
      rule.branchId,
      rule.barberId,
      rule.serviceId,
      rule.serviceCategoryId,
      rule.productId,
    ].filter((scope) => scope !== null).length;
  }

  private calculateAmount(
    type: CommissionType,
    value: number,
    quantity: number,
    unitPrice: number,
  ): number {
    const raw =
      type === CommissionType.PERCENTAGE
        ? unitPrice * quantity * (value / 100)
        : value * quantity;
    return Math.round(raw * 100) / 100;
  }
}
