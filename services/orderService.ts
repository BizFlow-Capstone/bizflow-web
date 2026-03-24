import { authFetch } from "@/lib/auth/tokenManager";
import type {
  ApiResponse,
  OrderPagination,
  OrderFull,
  OrderRecord,
  OrderFilters,
  CreateOrderRequest,
  ConfirmOrderRequest,
  UpdateOrderRequest,
  CancelOrderRequest,
  CompleteOrderRequest,
} from "@/lib/types/order";

type BackendOrderDetailDto = {
  orderDetailId: number;
  saleItemId: number;
  productId: number;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
};

type BackendOrderDto = {
  orderId: number;
  orderCode: string;
  refOrderId?: number | null;
  debtorId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  subTotal: number;
  discount: number;
  totalAmount: number;
  cashAmount: number;
  bankAmount: number;
  debtAmount: number;
  status: "pending" | "completed" | "cancelled";
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: BackendOrderDetailDto[];
};

type BackendOrderActionResult = {
  requiresConfirmation: boolean;
  warnings: string[];
  order?: BackendOrderDto | null;
};

const DEFAULT_LOCATION_ID = 1;

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

function resolvePaymentType(
  order: BackendOrderDto,
): "cash" | "bank" | "debt" | "mixed" {
  const activeChannels = [
    order.cashAmount > 0,
    order.bankAmount > 0,
    order.debtAmount > 0,
  ].filter(Boolean).length;

  if (activeChannels >= 2) return "mixed";
  if (order.debtAmount > 0) return "debt";
  if (order.bankAmount > 0) return "bank";
  return "cash";
}

function resolvePaymentStatus(
  order: BackendOrderDto,
): "PAID" | "PARTIAL" | "UNPAID" {
  if (order.status !== "completed") return "UNPAID";
  if (order.debtAmount > 0 && (order.cashAmount > 0 || order.bankAmount > 0)) {
    return "PARTIAL";
  }
  if (
    order.debtAmount > 0 &&
    order.cashAmount === 0 &&
    order.bankAmount === 0
  ) {
    return "UNPAID";
  }
  return "PAID";
}

function mapOrderDtoToRecord(order: BackendOrderDto): OrderRecord {
  const paymentType = resolvePaymentType(order);
  const paymentStatus = resolvePaymentStatus(order);

  return {
    orderId: order.orderId,
    orderCode: order.orderCode,
    status: order.status,
    businessLocationId: DEFAULT_LOCATION_ID,
    businessLocationName: "Cửa hàng",
    refOrderId: order.refOrderId ?? undefined,
    debtorId: order.debtorId ?? undefined,
    customerName: order.customerName ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    subTotal: order.subTotal,
    discount: order.discount,
    totalAmount: order.totalAmount,
    cashAmount: order.cashAmount,
    bankAmount: order.bankAmount,
    debtAmount: order.debtAmount,
    paymentType,
    paymentStatus,
    paidAmount: order.cashAmount + order.bankAmount,
    note: order.note ?? undefined,
    isFromAI: false,
    createdByUserId: "",
    createdByUserName: "Hệ thống",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    completedAt: order.completedAt ?? undefined,
    cancelledAt: order.cancelledAt ?? undefined,
    cancelReason: order.cancelReason ?? undefined,
  };
}

function mapOrderDtoToFull(order: BackendOrderDto): OrderFull {
  const mapped = mapOrderDtoToRecord(order);

  return {
    ...mapped,
    items: (order.items ?? []).map((item) => ({
      orderDetailId: item.orderDetailId,
      productId: item.productId,
      productName: item.productName,
      saleItemId: item.saleItemId,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      amount: item.amount,
      totalPrice: item.amount,
    })),
    payments: [
      ...(order.cashAmount > 0
        ? [{ method: "cash" as const, amount: order.cashAmount }]
        : []),
      ...(order.bankAmount > 0
        ? [{ method: "bank" as const, amount: order.bankAmount }]
        : []),
      ...(order.debtAmount > 0
        ? [{ method: "debt" as const, amount: order.debtAmount }]
        : []),
    ],
  };
}

function randomIdempotencyKey(): string {
  return `idp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function parseOrderFromActionResult(
  response: Response,
): Promise<ApiResponse<OrderRecord>> {
  const result = await parseApiResponse<BackendOrderActionResult>(response);
  const order = result.data?.order;

  if (!order) {
    throw new Error(result.message || "Không nhận được dữ liệu đơn hàng");
  }

  return {
    ...result,
    data: mapOrderDtoToRecord(order),
  };
}

export async function getOrders(
  filters: OrderFilters,
): Promise<ApiResponse<OrderPagination>> {
  const params = new URLSearchParams();
  params.append(
    "BusinessLocationId",
    String(filters.BusinessLocationId ?? DEFAULT_LOCATION_ID),
  );

  if (filters.Status) params.append("Status", filters.Status);
  if (filters.FromDate) params.append("FromDate", filters.FromDate);
  if (filters.ToDate) params.append("ToDate", filters.ToDate);
  if (filters.SearchQuery) params.append("Search", filters.SearchQuery);
  if (filters.PageNumber)
    params.append("PageNumber", String(filters.PageNumber));
  if (filters.PageSize) params.append("PageSize", String(filters.PageSize));

  const response = await authFetch(`/api/orders?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }

  const result = await parseApiResponse<{
    items: BackendOrderDto[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }>(response);

  return {
    ...result,
    data: {
      ...result.data,
      items: (result.data?.items ?? []).map(mapOrderDtoToRecord),
    },
  };
}

export async function getOrderDetail(
  orderId: number,
): Promise<ApiResponse<OrderFull>> {
  const response = await authFetch(`/api/orders/${orderId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order detail: ${response.status}`);
  }

  const result = await parseApiResponse<BackendOrderDto>(response);

  return {
    ...result,
    data: mapOrderDtoToFull(result.data),
  };
}

export async function createOrder(
  data: CreateOrderRequest,
): Promise<ApiResponse<OrderRecord>> {
  const response = await authFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await parseApiResponse<unknown>(response);
    throw new Error(
      result.message || `Failed to create order: ${response.status}`,
    );
  }

  return parseOrderFromActionResult(response);
}

export async function updateOrder(
  orderId: number,
  data: UpdateOrderRequest,
): Promise<ApiResponse<OrderRecord>> {
  const payload: UpdateOrderRequest = {
    ...data,
    idempotencyKey: data.idempotencyKey || randomIdempotencyKey(),
  };

  const response = await authFetch(`/api/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await parseApiResponse<unknown>(response);
    throw new Error(
      result.message || `Failed to update order: ${response.status}`,
    );
  }

  return parseOrderFromActionResult(response);
}

export async function confirmOrder(
  orderId: number,
  data: ConfirmOrderRequest,
): Promise<ApiResponse<OrderRecord>> {
  void data;
  const detail = await getOrderDetail(orderId);
  const record = mapOrderDtoToRecord({
    orderId: detail.data.orderId,
    orderCode: detail.data.orderCode,
    refOrderId: detail.data.refOrderId,
    debtorId: detail.data.debtorId,
    customerName: detail.data.customerName,
    customerPhone: detail.data.customerPhone,
    subTotal: detail.data.subTotal,
    discount: detail.data.discount,
    totalAmount: detail.data.totalAmount,
    cashAmount: detail.data.cashAmount,
    bankAmount: detail.data.bankAmount,
    debtAmount: detail.data.debtAmount,
    status: detail.data.status,
    note: detail.data.note,
    createdAt: detail.data.createdAt,
    updatedAt: detail.data.updatedAt ?? detail.data.createdAt,
    completedAt: detail.data.completedAt,
    cancelledAt: detail.data.cancelledAt,
    cancelReason: detail.data.cancelReason,
    items: detail.data.items.map((item) => ({
      orderDetailId: item.orderDetailId,
      saleItemId: item.saleItemId,
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      amount: item.amount,
    })),
  });
  return {
    ...detail,
    data: record,
  };
}

export async function cancelOrder(
  orderId: number,
  data: CancelOrderRequest = {},
): Promise<ApiResponse<OrderRecord>> {
  const response = await authFetch(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await parseApiResponse<unknown>(response);
    throw new Error(
      result.message || `Failed to cancel order: ${response.status}`,
    );
  }

  const result = await parseApiResponse<BackendOrderDto>(response);
  return {
    ...result,
    data: mapOrderDtoToRecord(result.data),
  };
}

export async function completeOrder(
  orderId: number,
  data: CompleteOrderRequest = {},
): Promise<ApiResponse<OrderRecord>> {
  const response = await authFetch(`/api/orders/${orderId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmLowStock: data.confirmLowStock ?? false }),
  });

  if (!response.ok) {
    const result = await parseApiResponse<unknown>(response);
    throw new Error(
      result.message || `Failed to complete order: ${response.status}`,
    );
  }

  return parseOrderFromActionResult(response);
}
