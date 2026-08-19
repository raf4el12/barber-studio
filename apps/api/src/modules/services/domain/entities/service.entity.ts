export class ServiceEntity {
  id!: string;
  name!: string;
  description!: string | null;
  price!: number;
  durationMinutes!: number | null;
  isActive!: boolean;
  categoryId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
