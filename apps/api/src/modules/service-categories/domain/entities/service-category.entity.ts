export class ServiceCategoryEntity {
  id!: string;
  name!: string;
  sortOrder!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
