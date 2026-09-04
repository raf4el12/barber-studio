import type {
  DateRange,
  ReportItemRow,
  ReportPaymentRow,
  ReportScope,
  ReportTicketRow,
} from '../interfaces/report-rows.interface';

export const REPORTS_REPOSITORY = 'IReportsRepository';

/**
 * Puerto de solo lectura. El adapter filtra tickets PAID no anulados;
 * la agregación vive en los use-cases (testeable con sets fijos).
 */
export interface IReportsRepository {
  findPayments(scope: ReportScope): Promise<ReportPaymentRow[]>;
  findPaidTickets(scope: ReportScope): Promise<ReportTicketRow[]>;
  findPaidItems(scope: ReportScope): Promise<ReportItemRow[]>;
  findPaidTicketsInRange(range: DateRange): Promise<ReportTicketRow[]>;
  findPaidItemsInRange(range: DateRange): Promise<ReportItemRow[]>;
}
