export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  isActive?: boolean;
  categoryId?: string;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
  categoryId?: string | null;
}
