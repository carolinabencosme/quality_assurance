export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  price: number;
  quantity: number;
  minStock: number;
  critical: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  name: string;
  description: string | null;
  status: ProductStatus;
};

export type ProductCreatePayload = {
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  price: number;
  quantity: number;
  minStock: number;
  status?: ProductStatus;
};

export type ProductUpdatePayload = {
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  price: number;
  minStock: number;
  status: ProductStatus;
};

export type ProductFilters = {
  search: string;
  categoryId: string;
  status: string;
  critical: string;
  page: number;
  size: number;
};
