import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BRANCH_REPOSITORY,
  type IBranchRepository,
} from '../../domain/repositories/branch.repository';
import { UpdateBranchDto } from '../dto/update-branch.dto';

@Injectable()
export class UpdateBranchUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: IBranchRepository,
  ) {}

  async execute(id: string, dto: UpdateBranchDto) {
    const branch = await this.branches.findById(id);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return this.branches.update(id, dto);
  }
}
