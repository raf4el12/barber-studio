import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/repositories/user.repository';
import { PASSWORD_HASHER } from '../domain/contracts/password-hasher.interface';
import { PrismaUserRepository } from '../infrastructure/persistence/prisma-user.repository';
import { BcryptPasswordHasher } from '../infrastructure/services/bcrypt-password-hasher.service';
import { UsersController } from '../interfaces/controllers/users.controller';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './use-cases/find-all-users.use-case';
import { FindOneUserUseCase } from './use-cases/find-one-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { AuditModule } from '../../audit/application/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindOneUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
