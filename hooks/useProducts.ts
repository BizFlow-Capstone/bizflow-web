import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getProducts,
  getProductSaleItems,
  getProductCostPriceHistory,
  getProductDetail,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  adjustProductStock,
  adjustSaleItemPrices,
  getQuickSearchProducts,
  getReorderSuggestions,
  getProductInsights,
  getAnomalyAlerts,
  acknowledgeAnomalyAlert,
  backfillVectorStore,
} from "@/services/productService";
import type {
  ProductFilters,
  ProductPagination,
  ProductSaleItems,
  ProductCostPriceHistory,
  ProductDetail,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
  AdjustStockRequest,
  AdjustSaleItemPriceRequest,
  QuickSearchProduct,
  ReorderSuggestion,
  ProductInsight,
  AnomalyAlert,
  ApiResponse,
  VectorStoreBackfillResult,
} from "@/lib/types/product";

/**
 * Query key factory for products
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  quickSearch: (locationId: number, query: string) =>
    [...productKeys.all, "quick-search", locationId, query] as const,
  reorderSuggestions: (locationId: number) =>
    [...productKeys.all, "reorder-suggestions", locationId] as const,
  productInsights: (locationId: number) =>
    [...productKeys.all, "product-insights", locationId] as const,
  anomalyAlertsRoot: () => [...productKeys.all, "anomaly-alerts"] as const,
  anomalyAlerts: (locationId: number, acknowledged?: boolean) =>
    [
      ...productKeys.anomalyAlertsRoot(),
      locationId,
      acknowledged === undefined ? "all" : acknowledged ? "acked" : "unacked",
    ] as const,
  reorderSuggestionProducts: (productIds: number[]) =>
    [...productKeys.all, "reorder-suggestion-products", ...productIds] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (productId: number) => [...productKeys.details(), productId] as const,
  saleItems: (productId: number) =>
    [...productKeys.all, "sale-items", productId] as const,
  costHistory: (productId: number) =>
    [...productKeys.all, "cost-history", productId] as const,
};

/**
 * Hook to quick search products
 */
export function useQuickSearchProducts(
  locationId: number,
  query: string,
  enabled: boolean = true,
) {
  return useQuery<QuickSearchProduct[]>({
    queryKey: productKeys.quickSearch(locationId, query),
    queryFn: async () => {
      const response = await getQuickSearchProducts(locationId, query);
      return response.data;
    },
    enabled:
      !!locationId && enabled && (query.length >= 2 || query.length === 0),
  });
}

/**
 * Hook to fetch AI reorder suggestions for current location.
 */
export function useReorderSuggestions(locationId: number) {
  return useQuery<ReorderSuggestion[]>({
    queryKey: productKeys.reorderSuggestions(locationId),
    queryFn: async () => {
      const response = await getReorderSuggestions(locationId);
      return response.data ?? [];
    },
    enabled: !!locationId,
  });
}

/**
 * Hook to fetch AI product insights for current location.
 */
export function useProductInsights(locationId: number) {
  return useQuery<ProductInsight[]>({
    queryKey: productKeys.productInsights(locationId),
    queryFn: async () => {
      const response = await getProductInsights(locationId);
      return response.data ?? [];
    },
    enabled: !!locationId,
  });
}

/**
 * Hook to fetch AI anomaly alerts for current location.
 */
export function useAnomalyAlerts(
  locationId: number,
  acknowledged?: boolean,
  enabled: boolean = true,
) {
  return useQuery<AnomalyAlert[]>({
    queryKey: productKeys.anomalyAlerts(locationId, acknowledged),
    queryFn: async () => {
      const response = await getAnomalyAlerts(locationId, acknowledged);
      return response.data ?? [];
    },
    enabled: !!locationId && enabled,
  });
}

/**
 * Hook to acknowledge a specific anomaly alert.
 */
export function useAcknowledgeAnomalyAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, locationId }: { id: string; locationId: number }) =>
      acknowledgeAnomalyAlert(id, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productKeys.anomalyAlertsRoot(),
      });
    },
  });
}

/**
 * Hook to trigger vector-store backfill for current location.
 */
export function useBackfillVectorStore() {
  return useMutation<ApiResponse<VectorStoreBackfillResult>, Error, number>({
    mutationFn: (locationId: number) => backfillVectorStore(locationId),
  });
}

export type ReorderSuggestionProductLookup = Record<
  number,
  {
    productName: string;
    costPrice: number;
  }
>;

/**
 * Hook to resolve product information for reorder suggestions when product list data is incomplete.
 */
export function useReorderSuggestionProductLookup(
  productIds: number[],
  locationId?: number,
) {
  const normalizedIds = Array.from(
    new Set(productIds.filter((id) => Number.isFinite(id) && id > 0)),
  ).sort((a, b) => a - b);

  return useQuery<ReorderSuggestionProductLookup>({
    queryKey: productKeys.reorderSuggestionProducts(normalizedIds),
    queryFn: async () => {
      const lookup: ReorderSuggestionProductLookup = {};
      const unresolvedIds = new Set<number>(normalizedIds);

      const entries = await Promise.all(
        normalizedIds.map(async (productId) => {
          try {
            const response = await getProductDetail(productId);
            const detail = response.data;

            unresolvedIds.delete(productId);
            return {
              productId,
              value: {
                productName:
                  detail.productName || detail.name || `SP #${productId}`,
                costPrice: Number(detail.costPrice) || 0,
              },
            };
          } catch {
            return null;
          }
        }),
      );

      entries.forEach((entry) => {
        if (!entry) return;
        lookup[entry.productId] = entry.value;
      });

      // Fallback: when detail endpoint misses, scan product list pages for current location.
      if (locationId && locationId > 0 && unresolvedIds.size > 0) {
        const statusCandidates: Array<"active" | "inactive" | undefined> = [
          undefined,
          "active",
          "inactive",
        ];

        for (const status of statusCandidates) {
          if (unresolvedIds.size === 0) break;

          let pageNumber = 1;
          let totalPages = 1;

          while (pageNumber <= totalPages && unresolvedIds.size > 0) {
            try {
              const response = await getProducts({
                locationId,
                status,
                pageNumber,
                pageSize: 200,
              });
              const page = response.data;

              totalPages = Math.max(page.totalPages || 1, 1);
              page.items.forEach((item) => {
                if (!unresolvedIds.has(item.productId)) return;
                lookup[item.productId] = {
                  productName:
                    item.productName || item.name || `SP #${item.productId}`,
                  costPrice: Number(item.costPrice) || 0,
                };
                unresolvedIds.delete(item.productId);
              });
            } catch {
              break;
            }

            pageNumber += 1;
          }
        }
      }

      unresolvedIds.forEach((id) => {
        lookup[id] = {
          productName: `SP #${id}`,
          costPrice: 0,
        };
      });

      return lookup;
    },
    enabled: normalizedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch products with filters and pagination
 * Uses keepPreviousData for smooth pagination transitions
 */
export function useProducts(filters: ProductFilters) {
  return useQuery<ProductPagination>({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await getProducts(filters);
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled: !!filters.locationId,
  });
}

/**
 * Hook to fetch sale items for a product
 */
export function useProductSaleItems(productId: number) {
  return useQuery<ProductSaleItems>({
    queryKey: productKeys.saleItems(productId),
    queryFn: async () => {
      const response = await getProductSaleItems(productId);
      return response.data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook to fetch cost price history for a product
 */
export function useProductCostPriceHistory(productId: number) {
  return useQuery<ProductCostPriceHistory>({
    queryKey: productKeys.costHistory(productId),
    queryFn: async () => {
      const response = await getProductCostPriceHistory(productId);
      return response.data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook to fetch a product detail
 */
export function useProductDetail(productId: number) {
  return useQuery<ProductDetail>({
    queryKey: productKeys.detail(productId),
    queryFn: async () => {
      const response = await getProductDetail(productId);
      return response.data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook to create a new product
 * Invalidates product list queries on success
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      // Invalidate all product list queries so they refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: UpdateProductRequest;
    }) => updateProduct(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.saleItems(variables.productId),
      });
    },
  });
}

/**
 * Hook to update product status (active/inactive)
 * Invalidates product list queries on success
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: UpdateProductStatusRequest;
    }) => updateProductStatus(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

/**
 * Hook to adjust sale item selling prices by a fixed delta. Owner only.
 */
export function useAdjustSaleItemPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdjustSaleItemPriceRequest) =>
      adjustSaleItemPrices(data),
    onSuccess: () => {
      // Invalidate all sale-item queries since we don't know which products were affected
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook to adjust product stock manually.
 * Increase creates import + stock movement. Decrease creates stock movement only.
 * Owner only.
 */
export function useAdjustProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: AdjustStockRequest;
    }) => adjustProductStock(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

/**
 * Hook to delete a product (soft delete)
 * Invalidates product list queries on success
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      queryClient.removeQueries({ queryKey: productKeys.saleItems(productId) });
    },
  });
}
