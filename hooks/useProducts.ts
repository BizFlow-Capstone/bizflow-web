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
} from "@/lib/types/product";

/**
 * Query key factory for products
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (productId: number) => [...productKeys.details(), productId] as const,
  saleItems: (productId: number) =>
    [...productKeys.all, "sale-items", productId] as const,
  costHistory: (productId: number) =>
    [...productKeys.all, "cost-history", productId] as const,
};

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
