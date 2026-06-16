import type { BranchEntity } from '../entities/branch.entity';
import type {
  CreateBranchData,
  UpdateBranchData,
} from '../interfaces/branch-data.interface';

export const BRANCH_REPOSITORY = 'IBranchRepository';

export interface IBranchRepository {
  create(data: CreateBranchData): Promise<BranchEntity>;
  findAll(): Promise<BranchEntity[]>;
  findById(id: string): Promise<BranchEntity | null>;
  update(id: string, data: UpdateBranchData): Promise<BranchEntity>;
  softDelete(id: string): Promise<void>;
}
