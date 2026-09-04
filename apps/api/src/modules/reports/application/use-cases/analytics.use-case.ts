import { Inject, Injectable } from '@nestjs/common';
import {
  REPORTS_REPOSITORY,
  type IReportsRepository,
} from '../../domain/repositories/reports.repository';
import {
  dailyVolume,
  payouts,
  ticketTotals,
  topServices,
} from '../services/report-aggregations.service';
import {
  parseDateRange,
  type RangeQuery,
} from '../services/report-range.service';

@Injectable()
export class GetBarberPayoutsUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY) private readonly reports: IReportsRepository,
  ) {}

  async execute(query: RangeQuery) {
    const range = parseDateRange(query);
    const [paidTickets, paidItems] = await Promise.all([
      this.reports.findPaidTicketsInRange(range),
      this.reports.findPaidItemsInRange(range),
    ]);
    const list = payouts(paidTickets, paidItems);
    const totals = ticketTotals(paidTickets);
    return {
      branchId: range.branchId,
      from: range.from,
      to: range.to,
      payouts: list,
      totals: {
        commission: list.reduce((sum, p) => sum + p.commission, 0),
        tips: totals.tips,
      },
    };
  }
}

@Injectable()
export class GetMetricsUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY) private readonly reports: IReportsRepository,
  ) {}

  async execute(query: RangeQuery) {
    const range = parseDateRange(query);
    const [paidTickets, paidItems] = await Promise.all([
      this.reports.findPaidTicketsInRange(range),
      this.reports.findPaidItemsInRange(range),
    ]);
    return {
      branchId: range.branchId,
      from: range.from,
      to: range.to,
      dailyVolume: dailyVolume(paidTickets),
      topBarbers: payouts(paidTickets, paidItems).slice(0, 10),
      topServices: topServices(paidItems),
    };
  }
}
