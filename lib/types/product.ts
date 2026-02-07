// Types for Product API

export interface Product {
  productId: number;
  name: string;
  price: number;
  trackInventory: boolean;
  stock: number;
  status: string; // "active" | "inactive"
}

export interface ProductPagination {
  items: Product[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SaleItem {
  saleItemId: number;
  unit: string;
  quantity: number;
  price: number;
}

export interface ProductSaleItems {
  productId: number;
  saleItems: SaleItem[];
}

export interface ProductFilters {
  locationId: number;
  name?: string;
  sku?: string;
  minCostPrice?: number;
  maxCostPrice?: number;
  minStock?: number;
  maxStock?: number;
  status?: string;
  trackInventory?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// --- Create Product ---

export interface PriceTier {
  unit: string;
  quantity: number;
  price: number;
}

export interface CreateProductRequest {
  locationId: number;
  businessTypeId: string;
  name: string;
  sku: string;
  trackInventory: boolean;
  unit: string;
  costPrice: number;
  stock: number;
  imageUrl?: string;
  manufacturer?: string;
  priceTiers: PriceTier[];
}

// --- Update Product Status ---

export interface UpdateProductStatusRequest {
  status: "active" | "inactive";
}
