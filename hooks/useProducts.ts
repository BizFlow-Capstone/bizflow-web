import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getProducts,
  getProductSaleItems,
  createProduct,
  updateProductStatus,
  deleteProduct,
} from "@/services/productService";
import type {
  ProductFilters,
  ProductPagination,
  ProductSaleItems,
  CreateProductRequest,
  UpdateProductStatusRequest,
} from "@/lib/types/product";

/**
 * Query key factory for products
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  saleItems: (productId: number) =>
    [...productKeys.all, "sale-items", productId] as const,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
