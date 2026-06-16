import { Module } from '@nestjs/common';
import { BRANCH_REPOSITORY } from '../domain/repositories/branch.repository';
import { PrismaBranchRepository } from '../infrastructure/persistence/prisma-branch.repository';
import { BranchesController } from '../interfaces/controllers/branches.controller';
import { CreateBranchUseCase } from './use-cases/create-branch.use-case';
import { FindAllBranchesUseCase } from './use-cases/find-all-branches.use-case';
import { FindOneBranchUseCase } from './use-cases/find-one-branch.use-case';
import { UpdateBranchUseCase } from './use-cases/update-branch.use-case';
import { DeleteBranchUseCase } from './use-cases/delete-branch.use-case';

@Module({
  controllers: [BranchesController],
  providers: [
    { provide: BRANCH_REPOSITORY, useClass: PrismaBranchRepository },
    CreateBranchUseCase,
    FindAllBranchesUseCase,
    FindOneBranchUseCase,
    UpdateBranchUseCase,
    DeleteBranchUseCase,
  ],
  exports: [BRANCH_REPOSITORY],
})
export class BranchesModule {}
