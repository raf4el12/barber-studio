export interface CreateServiceCategoryData {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateServiceCategoryData {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}
