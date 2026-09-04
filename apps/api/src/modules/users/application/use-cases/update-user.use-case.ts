import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import {
  PASSWORD_HASHER,
  type IPasswordHasher,
} from '../../domain/contracts/password-hasher.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { WriteAuditLogUseCase } from '../../../audit/application/use-cases/write-audit-log.use-case';
import { AuditAction } from '../../../audit/domain/constants/audit-actions';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    private readonly audit: WriteAuditLogUseCase,
  ) {}

  async execute(id: string, dto: UpdateUserDto, actorUserId?: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { password, ...rest } = dto;
    const updated = await this.users.update(id, {
      ...rest,
      ...(password ? { passwordHash: await this.hasher.hash(password) } : {}),
    });
    if (dto.role !== undefined || dto.branchId !== undefined) {
      await this.audit.execute({
        userId: actorUserId,
        branchId: updated.branchId,
        action: AuditAction.USER_ROLE_CHANGED,
        entityType: 'User',
        entityId: id,
        metadata: {
          before: { role: user.role, branchId: user.branchId },
          after: { role: updated.role, branchId: updated.branchId },
        },
      });
    }
    return updated;
  }
}
