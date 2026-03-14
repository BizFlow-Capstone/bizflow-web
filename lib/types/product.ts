// Types for Product API

export interface Product {
  productId: number;
  businessLocationId: number;
  businessLocationName?: string;
  businessTypeId: string;
  businessTypeName?: string;
  productName: string;
  name: string; // alias for backward compat (= productName)
  sku?: string | null;
  unit: string;
  sellingPrice: number;
  price: number; // alias for backward compat (= sellingPrice)
  costPrice: number;
  stock: number;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  manufacturer?: string | null;
  trackInventory: boolean;
  status: string; // "active" | "inactive"
  deletedAt?: string;
}

export interface ProductDetail extends Product {
  saleItems: SaleItem[];
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
  errors?: unknown;
  warnings?: unknown;
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
  sku?: string;
  trackInventory: boolean;
  unit: string;
  sellingPrice?: number;
  costPrice: number;
  stock: number;
  image?: File;
  imageUrl?: string;
  manufacturer?: string;
  priceTiers: PriceTier[];
}

export interface UpdateProductRequest {
  locationId: number;
  businessTypeId: string;
  name: string;
  sku?: string;
  trackInventory: boolean;
  unit: string;
  sellingPrice?: number;
  costPrice: number;
  stock: number;
  image?: File;
  manufacturer?: string;
  priceTiers: PriceTier[];
  removeImage?: boolean;
}

// --- Update Product Status ---

export interface UpdateProductStatusRequest {
  status: "active" | "inactive";
}
