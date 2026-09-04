import { BadRequestException } from '@nestjs/common';
import { ListAuditLogsUseCase } from './list-audit-logs.use-case';

describe('ListAuditLogsUseCase', () => {
  function setup() {
    const repo = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    };
    const useCase = new ListAuditLogsUseCase(repo as never);
    return { repo, useCase };
  }

  it('pasa filtros y pagina con defaults (page 1, limit 20)', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({ action: 'TICKET_VOIDED' });
    expect(repo.findAll).toHaveBeenCalledWith(
      { action: 'TICKET_VOIDED' },
      1,
      20,
    );
  });

  it('limita el page size a 100', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({ limit: 500 });
    expect(repo.findAll).toHaveBeenCalledWith({}, 1, 100);
  });

  it('rechaza rango de fechas inválido', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ from: '2026-06-02', to: '2026-06-01' }),
    ).rejects.toThrow(BadRequestException);
    await expect(useCase.execute({ from: 'no-fecha' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
