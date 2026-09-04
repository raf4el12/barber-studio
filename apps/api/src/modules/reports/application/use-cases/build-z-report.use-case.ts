import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  REPORTS_REPOSITORY,
  type IReportsRepository,
} from '../../domain/repositories/reports.repository';
import type { ReportScope } from '../../domain/interfaces/report-rows.interface';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../../cash-registers/domain/repositories/cash-register.repository';
import {
  cashReconciliation,
  incomeByMethod,
  payouts,
  ticketTotals,
} from '../services/report-aggregations.service';
export interface ZReportQuery {
  cashRegisterId?: string;
  branchId?: string;
  date?: string;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return !Number.isNaN(time);
}

@Injectable()
export class BuildZReportUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY) private readonly reports: IReportsRepository,
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly registers: ICashRegisterRepository,
  ) {}

  async execute(query: ZReportQuery) {
    if (query.cashRegisterId) {
      const register = await this.registers.findById(query.cashRegisterId);
      if (!register) {
        throw new NotFoundException(
          `Caja no encontrada: ${query.cashRegisterId}`,
        );
      }
      const scope: ReportScope = {
        kind: 'register',
        cashRegisterId: register.id,
      };
      return this.build(scope, register);
    }
    if (!query.branchId) {
      throw new BadRequestException('Se requiere branchId o cashRegisterId');
    }
    if (!query.date || !isValidDate(query.date)) {
      throw new BadRequestException(
        'Fecha inválida, formato esperado YYYY-MM-DD',
      );
    }
    const from = new Date(`${query.date}T00:00:00.000Z`);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    const scope: ReportScope = {
      kind: 'day',
      branchId: query.branchId,
      from,
      to,
    };
    return this.build(scope, null);
  }

  private async build(
    scope: ReportScope,
    register: {
      id: string;
      branchId: string;
      openedAt: Date;
      closedAt: Date | null;
      openingAmount: number;
      closingCountedCash: number | null;
    } | null,
  ) {
    const [payments, paidTickets, paidItems] = await Promise.all([
      this.reports.findPayments(scope),
      this.reports.findPaidTickets(scope),
      this.reports.findPaidItems(scope),
    ]);
    return {
      scope:
        scope.kind === 'register'
          ? { kind: scope.kind, cashRegisterId: scope.cashRegisterId }
          : {
              kind: scope.kind,
              branchId: scope.branchId,
              date: scope.from.toISOString().slice(0, 10),
            },
      register,
      incomeByMethod: incomeByMethod(payments),
      totals: ticketTotals(paidTickets),
      cash: cashReconciliation(register, payments),
      payouts: payouts(paidTickets, paidItems),
    };
  }
}
