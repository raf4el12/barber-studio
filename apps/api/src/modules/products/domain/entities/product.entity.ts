export class ProductEntity {
  id!: string;
  sku!: string | null;
  name!: string;
  description!: string | null;
  price!: number;
  cost!: number | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
