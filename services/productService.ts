import type {
  ApiResponse,
  ProductPagination,
  ProductSaleItems,
  ProductFilters,
  CreateProductRequest,
  Product,
  UpdateProductStatusRequest,
} from "@/lib/types/product";

/**
 * Product Service
 * Pure API calling logic - no React hooks here
 *
 * Flow: Service → API Route → Backend
 */

/**
 * Fetch products with filters and pagination
 */
export async function getProducts(
  filters: ProductFilters,
): Promise<ApiResponse<ProductPagination>> {
  const params = new URLSearchParams();

  // Required
  params.append("LocationId", String(filters.locationId));

  // Optional filters
  if (filters.name) params.append("Name", filters.name);
  if (filters.sku) params.append("Sku", filters.sku);
  if (filters.minCostPrice !== undefined)
    params.append("MinCostPrice", String(filters.minCostPrice));
  if (filters.maxCostPrice !== undefined)
    params.append("MaxCostPrice", String(filters.maxCostPrice));
  if (filters.minStock !== undefined)
    params.append("MinStock", String(filters.minStock));
  if (filters.maxStock !== undefined)
    params.append("MaxStock", String(filters.maxStock));
  if (filters.status) params.append("Status", filters.status);
  if (filters.trackInventory !== undefined)
    params.append("TrackInventory", String(filters.trackInventory));

  // Pagination
  if (filters.pageNumber)
    params.append("PageNumber", String(filters.pageNumber));
  if (filters.pageSize) params.append("PageSize", String(filters.pageSize));

  const response = await fetch(`/api/products?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch sale items (price tiers) for a specific product
 */
export async function getProductSaleItems(
  productId: number,
): Promise<ApiResponse<ProductSaleItems>> {
  const response = await fetch(`/api/products/${productId}/sale-items`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sale items: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new product with price tiers
 */
export async function createProduct(
  data: CreateProductRequest,
): Promise<ApiResponse<Product>> {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.status}`);
  }

  return response.json();
}

/**
 * Update product status (active/inactive)
 */
export async function updateProductStatus(
  productId: number,
  data: UpdateProductStatusRequest,
): Promise<ApiResponse<null>> {
  const response = await fetch(`/api/products/${productId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update product status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(
  productId: number,
): Promise<ApiResponse<null>> {
  const response = await fetch(`/api/products/${productId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete product: ${response.status}`);
  }

  return response.json();
}
