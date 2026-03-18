import type {
  ApiResponse,
  ProductPagination,
  ProductSaleItems,
  ProductCostPriceHistory,
  ProductFilters,
  CreateProductRequest,
  Product,
  ProductDetail,
  UpdateProductStatusRequest,
  UpdateProductRequest,
  AdjustStockRequest,
  AdjustSaleItemPriceRequest,
} from "@/lib/types/product";
import { authFetch } from "@/lib/auth/tokenManager";

function buildProductFormData(
  data: CreateProductRequest | UpdateProductRequest,
): FormData {
  const formData = new FormData();

  formData.append("LocationId", String(data.locationId));
  formData.append("BusinessTypeId", String(data.businessTypeId));
  formData.append("ProductName", String(data.name));
  formData.append("Unit", String(data.unit));

  if (data.sku) formData.append("Sku", String(data.sku));
  formData.append("TrackInventory", String(data.trackInventory ?? true));
  formData.append("SellingPrice", String(data.sellingPrice ?? 0));
  formData.append("CostPrice", String(data.costPrice ?? 0));
  formData.append("Stock", String(data.stock ?? 0));
  if (data.manufacturer)
    formData.append("Manufacturer", String(data.manufacturer));

  if ("removeImage" in data) {
    formData.append("RemoveImage", String(Boolean(data.removeImage)));
  }

  if (data.image) {
    formData.append("Image", data.image);
  }

  if (Array.isArray(data.priceTiers)) {
    data.priceTiers.forEach((tier, index) => {
      formData.append(`PriceTiers[${index}].Unit`, String(tier.unit));
      formData.append(`PriceTiers[${index}].Quantity`, String(tier.quantity));
      formData.append(`PriceTiers[${index}].Price`, String(tier.price));
    });
  }

  return formData;
}

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
  if (filters.search) params.append("Search", filters.search);
  if (filters.name) params.append("Name", filters.name);
  if (filters.sku) params.append("Sku", filters.sku);
  if (filters.businessTypeIds && filters.businessTypeIds.length > 0)
    filters.businessTypeIds.forEach((id) =>
      params.append("BusinessTypeIds", id),
    );
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

  const response = await authFetch(`/api/products?${params.toString()}`, {
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
  const response = await authFetch(`/api/products/${productId}/sale-items`, {
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
 * Fetch cost price history for a specific product
 */
export async function getProductCostPriceHistory(
  productId: number,
): Promise<ApiResponse<ProductCostPriceHistory>> {
  const response = await authFetch(
    `/api/products/${productId}/cost-price-history`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch product cost price history: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Fetch detailed data for a specific product
 */
export async function getProductDetail(
  productId: number,
): Promise<ApiResponse<ProductDetail>> {
  const response = await authFetch(`/api/products/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product detail: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new product with price tiers
 */
export async function createProduct(
  data: CreateProductRequest,
): Promise<ApiResponse<Product>> {
  const formData = buildProductFormData(data);

  const response = await authFetch("/api/products", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.status}`);
  }

  return response.json();
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: number,
  data: UpdateProductRequest,
): Promise<ApiResponse<Product>> {
  const formData = buildProductFormData(data);

  const response = await authFetch(`/api/products/${productId}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to update product: ${response.status}`);
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
  const response = await authFetch(`/api/products/${productId}/status`, {
    method: "PATCH",
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
 * Adjust selected sale-item selling prices by fixed delta. Owner only.
 */
export async function adjustSaleItemPrices(
  data: AdjustSaleItemPriceRequest,
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/products/sale-items/selling-price`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to adjust sale item prices: ${response.status}`);
  }

  return response.json();
}

/**
 * Adjust product stock manually (increase or decrease).
 * Increase creates import + stock movement. Decrease creates stock movement only.
 * Owner only.
 */
export async function adjustProductStock(
  productId: number,
  data: AdjustStockRequest,
): Promise<ApiResponse<Product>> {
  const response = await authFetch(`/api/products/${productId}/stock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to adjust product stock: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(
  productId: number,
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/products/${productId}`, {
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
