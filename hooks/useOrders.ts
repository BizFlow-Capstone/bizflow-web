/**
 * Order Hooks
 * TanStack Query hooks for order data fetching and mutations
 * Handles caching, invalidation, and loading states
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getOrders,
  getOrderDetail,
  createOrder,
  confirmOrder,
  cancelOrder,
  completeOrder,
} from "@/services/orderService";
import type {
  OrderFilters,
  OrderPagination,
  OrderFull,
  CreateOrderRequest,
  ConfirmOrderRequest,
} from "@/lib/types/order";

/**
 * Query key factory for orders
 */
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
};

/**
 * Hook to fetch orders with filters and pagination
 * Uses keepPreviousData for smooth pagination transitions
 */
export function useOrders(filters: OrderFilters) {
  return useQuery<OrderPagination>({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const response = await getOrders(filters);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch order detail by ID
 */
export function useOrderDetail(orderId: number) {
  return useQuery<OrderFull>({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const response = await getOrderDetail(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook to create a new order
 * Invalidates order list queries on success
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Hook to confirm a DRAFT order
 * Invalidates both list and detail queries on success
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data: ConfirmOrderRequest;
    }) => confirmOrder(orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
    },
  });
}

/**
 * Hook to cancel an order
 * Invalidates both list and detail queries on success
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => cancelOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
    },
  });
}

/**
 * Hook to complete an order (PENDING → COMPLETED)
 * Invalidates both list and detail queries on success
 */
export function useCompleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => completeOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
    },
  });
}
