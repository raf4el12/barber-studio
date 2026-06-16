export interface CreateBranchData {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchData {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}
