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
  QuickSearchProduct,
  ReorderSuggestion,
  ProductInsight,
  AnomalyAlert,
  VectorStoreBackfillResult,
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
    const normalizedTiers = data.priceTiers
      .map((tier) => ({
        unit: String(tier.unit ?? "").trim(),
        quantity: Number(tier.quantity) || 1,
        price: Number(tier.price) || 0,
      }))
      .filter((tier) => tier.unit.length > 0);

    formData.append("PriceTiers", JSON.stringify(normalizedTiers));
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
  if (filters.businessTypeId) {
    params.append("BusinessTypeId", filters.businessTypeId);
  } else if (filters.businessTypeIds && filters.businessTypeIds.length > 0) {
    // Backend currently supports a single BusinessTypeId.
    params.append("BusinessTypeId", filters.businessTypeIds[0]);
  }

  const minSellingPrice =
    filters.minSellingPrice !== undefined
      ? filters.minSellingPrice
      : filters.minCostPrice;
  if (minSellingPrice !== undefined)
    params.append("MinSellingPrice", String(minSellingPrice));

  const maxSellingPrice =
    filters.maxSellingPrice !== undefined
      ? filters.maxSellingPrice
      : filters.maxCostPrice;
  if (maxSellingPrice !== undefined)
    params.append("MaxSellingPrice", String(maxSellingPrice));

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

  const result = (await response.json()) as ApiResponse<ProductPagination>;
  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          items: (result.data.items ?? []).map((item) => {
            const imageFromPayload =
              (item as Product & { ImageUrl?: string | null }).imageUrl ??
              (item as Product & { ImageUrl?: string | null }).ImageUrl ??
              null;

            return {
              ...item,
              imageUrl: imageFromPayload,
              status:
                typeof item.status === "object" && item.status !== null
                  ? (item.status as { code: string }).code
                  : item.status,
            };
          }),
        }
      : result.data,
  };
}

/**
 * Quick search products by location and keyword
 */
export async function getQuickSearchProducts(
  locationId: number,
  searchQuery: string,
): Promise<ApiResponse<QuickSearchProduct[]>> {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.append("search", searchQuery);
  }

  const response = await authFetch(
    `/api/locations/${locationId}/products/quick-search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to quick search products: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch AI reorder suggestions (pre-computed nightly).
 */
export async function getReorderSuggestions(
  locationId: number,
): Promise<ApiResponse<ReorderSuggestion[]>> {
  const params = new URLSearchParams();
  params.append("locationId", String(locationId));

  const response = await authFetch(
    `/api/my-business/ai/reorder?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch reorder suggestions: ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ReorderSuggestion[]>;
  return {
    ...payload,
    data: (payload.data ?? []).map((item) => ({
      ...item,
      productId: String(item.productId),
    })),
  };
}

/**
 * Fetch AI product insights (pre-computed nightly).
 */
export async function getProductInsights(
  locationId: number,
): Promise<ApiResponse<ProductInsight[]>> {
  const params = new URLSearchParams();
  params.append("locationId", String(locationId));

  const response = await authFetch(
    `/api/my-business/ai/insights?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch product insights: ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ProductInsight[]>;
  return {
    ...payload,
    data: (payload.data ?? []).map((item) => ({
      ...item,
      productId: String(item.productId),
    })),
  };
}

/**
 * Fetch AI anomaly alerts. Use acknowledged=false to fetch unacknowledged alerts.
 */
export async function getAnomalyAlerts(
  locationId: number,
  acknowledged?: boolean,
): Promise<ApiResponse<AnomalyAlert[]>> {
  const params = new URLSearchParams();
  params.append("locationId", String(locationId));

  if (typeof acknowledged === "boolean") {
    params.append("acknowledged", String(acknowledged));
  }

  const response = await authFetch(
    `/api/my-business/ai/anomalies?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch anomaly alerts: ${response.status}`);
  }

  return (await response.json()) as ApiResponse<AnomalyAlert[]>;
}

/**
 * Mark anomaly alert as acknowledged by owner.
 */
export async function acknowledgeAnomalyAlert(
  id: string,
  locationId: number,
): Promise<ApiResponse<null>> {
  const params = new URLSearchParams();
  params.append("locationId", String(locationId));

  const response = await authFetch(
    `/api/my-business/ai/anomalies/${encodeURIComponent(id)}/acknowledge?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to acknowledge anomaly alert: ${response.status}`);
  }

  return (await response.json()) as ApiResponse<null>;
}

/**
 * Backfill all active products of location into vector store.
 */
export async function backfillVectorStore(
  locationId: number,
): Promise<ApiResponse<VectorStoreBackfillResult>> {
  const params = new URLSearchParams();
  params.append("locationId", String(locationId));

  const response = await authFetch(
    `/api/my-business/ai/vector-store/backfill?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to backfill vector store: ${response.status}`);
  }

  return (await response.json()) as ApiResponse<VectorStoreBackfillResult>;
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
