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
  getAllOrders,
  getOrderDetail,
  createOrder,
  updateOrder,
  confirmOrder,
  cancelOrder,
  completeOrder,
  createAIDraftOrder,
} from "@/services/orderService";
import type {
  OrderFilters,
  OrderPagination,
  OrderFull,
  CreateOrderRequest,
  ConfirmOrderRequest,
  UpdateOrderRequest,
  CompleteOrderRequest,
  AIDraftOrderData,
} from "@/lib/types/order";

/**
 * Query key factory for orders
 */
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  listsAllPages: () => [...orderKeys.all, "list-all-pages"] as const,
  listAllPages: (filters: OrderFilters) =>
    [...orderKeys.listsAllPages(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
};

/**
 * Hook to fetch orders with filters and pagination
 * Uses keepPreviousData for smooth pagination transitions
 */
export function useOrders(filters: OrderFilters, enabled = true) {
  return useQuery<OrderPagination>({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const response = await getOrders(filters);
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAllOrders(filters: OrderFilters, enabled = true) {
  return useQuery<OrderPagination>({
    queryKey: orderKeys.listAllPages(filters),
    queryFn: async () => {
      const response = await getAllOrders(filters);
      return response.data;
    },
    enabled,
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

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data: UpdateOrderRequest;
    }) => updateOrder(orderId, data),
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
    mutationFn: (
      input:
        | number
        | {
            orderId: number;
            data?: { cancelReason?: string };
          },
    ) => {
      if (typeof input === "number") {
        return cancelOrder(input);
      }
      return cancelOrder(input.orderId, input.data);
    },
    onSuccess: (_data, input) => {
      const targetOrderId = typeof input === "number" ? input : input.orderId;
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(targetOrderId),
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
    mutationFn: (
      input:
        | number
        | {
            orderId: number;
            data?: CompleteOrderRequest;
          },
    ) => {
      if (typeof input === "number") {
        return completeOrder(input);
      }

      return completeOrder(input.orderId, input.data);
    },
    onSuccess: (_data, input) => {
      const targetOrderId = typeof input === "number" ? input : input.orderId;
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(targetOrderId),
      });
    },
  });
}

export function useCreateAIDraftOrder() {
  return useMutation<
    AIDraftOrderData,
    Error,
    { locationId: number; audioFile: File }
  >({
    mutationFn: async ({ locationId, audioFile }) => {
      const response = await createAIDraftOrder(locationId, audioFile);
      return response.data;
    },
  });
}
