export interface CreateProductData {
  sku?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  isActive?: boolean;
}

export interface UpdateProductData {
  sku?: string | null;
  name?: string;
  description?: string;
  price?: number;
  cost?: number | null;
  isActive?: boolean;
}
