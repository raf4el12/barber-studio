import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BRANCH_REPOSITORY,
  type IBranchRepository,
} from '../../domain/repositories/branch.repository';

@Injectable()
export class FindOneBranchUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: IBranchRepository,
  ) {}

  async execute(id: string) {
    const branch = await this.branches.findById(id);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }
}
