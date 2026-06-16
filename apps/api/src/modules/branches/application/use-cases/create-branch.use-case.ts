import { Inject, Injectable } from '@nestjs/common';
import {
  BRANCH_REPOSITORY,
  type IBranchRepository,
} from '../../domain/repositories/branch.repository';
import { CreateBranchDto } from '../dto/create-branch.dto';

@Injectable()
export class CreateBranchUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: IBranchRepository,
  ) {}

  execute(dto: CreateBranchDto) {
    return this.branches.create(dto);
  }
}
