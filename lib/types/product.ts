// Types for Product API

export interface Product {
  productId: number;
  businessLocationId: number;
  businessTypeId: string;
  productName: string;
  name: string; // alias for backward compat (= productName)
  sku?: string;
  unit: string;
  sellingPrice: number;
  price: number; // alias for backward compat (= sellingPrice)
  costPrice: number;
  stock: number;
  imageUrl?: string;
  imagePublicId?: string;
  manufacturer?: string;
  trackInventory: boolean;
  status: string; // "active" | "inactive"
  deletedAt?: string;
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
  deletedAt?: string;
}

export interface ProductPricePolicy {
  productPricePolicyId: number;
  saleItemId: number;
  price: number;
  isDefault: boolean;
  startAt?: string;
  endAt?: string;
}

export interface ProductSaleItems {
  productId: number;
  saleItems: SaleItem[];
}

export interface ProductFilters {
  locationId: number;
  name?: string;
  sku?: string;
  businessTypeIds?: string[];
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
