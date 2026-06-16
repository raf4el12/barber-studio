import { Inject, Injectable } from '@nestjs/common';
import {
  BRANCH_REPOSITORY,
  type IBranchRepository,
} from '../../domain/repositories/branch.repository';

@Injectable()
export class FindAllBranchesUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: IBranchRepository,
  ) {}

  execute() {
    return this.branches.findAll();
  }
}
