import { BadRequestException } from '@nestjs/common';
import { isValidDate } from '../use-cases/build-z-report.use-case';
import type { DateRange } from '../../domain/interfaces/report-rows.interface';

export interface RangeQuery {
  branchId?: string;
  from?: string;
  to?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 30;

export function parseDateRange(query: RangeQuery): DateRange {
  if (!query.branchId) {
    throw new BadRequestException('Se requiere branchId');
  }
  const to = query.to ? parseDay(query.to) : new Date();
  const from = query.from
    ? parseDay(query.from)
    : new Date(to.getTime() - DEFAULT_DAYS * DAY_MS);
  if (from > to) {
    throw new BadRequestException('from debe ser anterior a to');
  }
  return { branchId: query.branchId, from, to };
}

function parseDay(value: string): Date {
  if (!isValidDate(value)) {
    throw new BadRequestException(
      `Fecha inválida, formato esperado YYYY-MM-DD: ${value}`,
    );
  }
  return new Date(`${value}T00:00:00.000Z`);
}
