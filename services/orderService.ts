/**
 * Order Service
 * Pure API calling logic - no React hooks here
 *
 * Flow: Service → API Route → Backend
 * NOTE: Currently using mock data for development
 */

import type {
  ApiResponse,
  OrderPagination,
  OrderFull,
  OrderRecord,
  OrderFilters,
  CreateOrderRequest,
  ConfirmOrderRequest,
} from "@/lib/types/order";

// ============================================
// MOCK DATA — Remove when backend is ready
// ============================================

const MOCK_ORDERS: OrderRecord[] = [
  {
    orderId: 1,
    orderCode: "ORD-20260301-001",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "PAID",
    subTotal: 5950000,
    discount: 0,
    totalAmount: 5950000,
    cashAmount: 5950000,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 5950000,
    isFromAI: false,
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-01T08:30:00Z",
    completedAt: "2026-03-01T08:35:00Z",
  },
  {
    orderId: 2,
    orderCode: "ORD-20260301-002",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "PAID",
    subTotal: 9500000,
    discount: 0,
    totalAmount: 9500000,
    cashAmount: 9500000,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 9500000,
    isFromAI: false,
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-01T14:15:00Z",
    completedAt: "2026-03-01T14:20:00Z",
  },
  {
    orderId: 3,
    orderCode: "ORD-20260302-001",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "mixed",
    paymentStatus: "PARTIAL",
    debtorId: 5,
    debtorName: "Anh Ba",
    subTotal: 15200000,
    discount: 0,
    totalAmount: 15200000,
    cashAmount: 12000000,
    bankAmount: 0,
    debtAmount: 3200000,
    paidAmount: 12000000,
    isFromAI: false,
    note: "Anh Ba lấy xi măng + sắt, trả trước 12tr, nợ lại 3.2tr",
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-02T09:00:00Z",
    completedAt: "2026-03-02T09:10:00Z",
  },
  {
    orderId: 4,
    orderCode: "ORD-20260303-001",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "bank",
    paymentStatus: "PAID",
    subTotal: 7500000,
    discount: 0,
    totalAmount: 7500000,
    cashAmount: 0,
    bankAmount: 7500000,
    debtAmount: 0,
    paidAmount: 7500000,
    isFromAI: false,
    createdByUserId: "u-emp-001",
    createdByUserName: "Trần Thị Lan",
    createdAt: "2026-03-03T10:45:00Z",
    completedAt: "2026-03-03T10:50:00Z",
  },
  {
    orderId: 5,
    orderCode: "ORD-20260304-001",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "debt",
    paymentStatus: "UNPAID",
    debtorId: 5,
    debtorName: "Anh Ba",
    subTotal: 4200000,
    discount: 0,
    totalAmount: 4200000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 4200000,
    paidAmount: 0,
    isFromAI: false,
    note: "Anh Ba mua thêm vật liệu, ghi nợ toàn bộ",
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-04T07:20:00Z",
    completedAt: "2026-03-04T07:25:00Z",
  },
  {
    orderId: 6,
    orderCode: "ORD-20260305-001",
    status: "pending",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "UNPAID",
    subTotal: 3800000,
    discount: 0,
    totalAmount: 3800000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: false,
    createdByUserId: "u-emp-001",
    createdByUserName: "Trần Thị Lan",
    createdAt: "2026-03-05T11:00:00Z",
  },
  {
    orderId: 7,
    orderCode: "ORD-20260306-001",
    status: "pending",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "UNPAID",
    subTotal: 2850000,
    discount: 0,
    totalAmount: 2850000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: true,
    aiConfidence: 0.92,
    originalTranscript: "lấy 30 bao xi măng cho anh Tư",
    note: "Đơn AI tạo từ giọng nói",
    createdByUserId: "u-owner-001",
    createdByUserName: "AI Assistant",
    createdAt: "2026-03-06T08:10:00Z",
  },
  {
    orderId: 8,
    orderCode: "ORD-20260306-002",
    status: "pending",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "debt",
    paymentStatus: "UNPAID",
    debtorId: 8,
    debtorName: "Chú Năm",
    subTotal: 6400000,
    discount: 0,
    totalAmount: 6400000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: true,
    aiConfidence: 0.88,
    originalTranscript: "chú Năm lấy 2 tấn cát + 50 bao xi măng, ghi nợ",
    note: "Đơn AI tạo",
    createdByUserId: "u-owner-001",
    createdByUserName: "AI Assistant",
    createdAt: "2026-03-06T09:30:00Z",
  },
  {
    orderId: 9,
    orderCode: "ORD-20260307-001",
    status: "cancelled",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "UNPAID",
    subTotal: 3200000,
    discount: 0,
    totalAmount: 3200000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: false,
    note: "Khách hủy đơn",
    cancelReasonCode: "customer_changed_mind",
    cancelReason: "Khách đổi ý không mua nữa",
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-07T15:00:00Z",
    updatedAt: "2026-03-07T15:30:00Z",
    cancelledAt: "2026-03-07T15:30:00Z",
  },
  {
    orderId: 10,
    orderCode: "ORD-20260308-001",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "mixed",
    paymentStatus: "PAID",
    debtorId: 12,
    debtorName: "Cô Bảy",
    subTotal: 20100000,
    discount: 0,
    totalAmount: 20100000,
    cashAmount: 15000000,
    bankAmount: 5100000,
    debtAmount: 0,
    paidAmount: 20100000,
    isFromAI: false,
    note: "Đơn lớn: 15tr TM + 5.1tr CK",
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-08T08:00:00Z",
    completedAt: "2026-03-08T08:10:00Z",
  },
  {
    orderId: 11,
    orderCode: "ORD-20260309-001",
    status: "pending",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "bank",
    paymentStatus: "UNPAID",
    subTotal: 11200000,
    discount: 0,
    totalAmount: 11200000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: false,
    note: "Chờ khách chuyển khoản",
    createdByUserId: "u-emp-001",
    createdByUserName: "Trần Thị Lan",
    createdAt: "2026-03-09T13:20:00Z",
  },
  {
    orderId: 12,
    orderCode: "ORD-20260310-001",
    status: "completed",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "PAID",
    subTotal: 1425000,
    discount: 0,
    totalAmount: 1425000,
    cashAmount: 1425000,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 1425000,
    isFromAI: false,
    createdByUserId: "u-emp-001",
    createdByUserName: "Trần Thị Lan",
    createdAt: "2026-03-10T16:45:00Z",
    completedAt: "2026-03-10T16:50:00Z",
  },
  {
    orderId: 13,
    orderCode: "ORD-20260311-001",
    status: "pending",
    businessLocationId: 1,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: "cash",
    paymentStatus: "UNPAID",
    subTotal: 8750000,
    discount: 0,
    totalAmount: 8750000,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: false,
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-03-11T07:00:00Z",
  },
];

const MOCK_ORDER_DETAILS: Record<number, OrderFull> = {
  1: {
    ...MOCK_ORDERS[0],
    items: [
      {
        orderDetailId: 1,
        productId: 1,
        productName: "Xi măng Hà Tiên PCB40",
        saleItemId: 1,
        unit: "Bao (50kg)",
        quantity: 50,
        unitPrice: 95000,
        discount: 0,
        amount: 4750000,
        totalPrice: 4750000,
      },
      {
        orderDetailId: 2,
        productId: 5,
        productName: "Dịch vụ cắt sắt",
        saleItemId: 10,
        unit: "Lần",
        quantity: 4,
        unitPrice: 300000,
        discount: 0,
        amount: 1200000,
        totalPrice: 1200000,
      },
    ],
    payments: [{ method: "cash", amount: 5950000 }],
  },
  3: {
    ...MOCK_ORDERS[2],
    items: [
      {
        orderDetailId: 5,
        productId: 1,
        productName: "Xi măng Hà Tiên PCB40",
        saleItemId: 1,
        unit: "Bao (50kg)",
        quantity: 100,
        unitPrice: 95000,
        discount: 0,
        amount: 9500000,
        totalPrice: 9500000,
      },
      {
        orderDetailId: 6,
        productId: 3,
        productName: "Sắt thép Pomina D10",
        saleItemId: 5,
        unit: "Cây (11.7m)",
        quantity: 30,
        unitPrice: 150000,
        discount: 0,
        amount: 4500000,
        totalPrice: 4500000,
      },
      {
        orderDetailId: 7,
        productId: 5,
        productName: "Dịch vụ cắt sắt",
        saleItemId: 10,
        unit: "Lần",
        quantity: 4,
        unitPrice: 300000,
        discount: 0,
        amount: 1200000,
        totalPrice: 1200000,
      },
    ],
    payments: [
      { method: "cash", amount: 12000000 },
      { method: "debt", amount: 3200000 },
    ],
  },
  7: {
    ...MOCK_ORDERS[6],
    items: [
      {
        orderDetailId: 12,
        productId: 1,
        productName: "Xi măng Hà Tiên PCB40",
        saleItemId: 1,
        unit: "Bao (50kg)",
        quantity: 30,
        unitPrice: 95000,
        discount: 0,
        amount: 2850000,
        totalPrice: 2850000,
      },
    ],
    payments: [{ method: "cash", amount: 0 }],
  },
  10: {
    ...MOCK_ORDERS[9],
    items: [
      {
        orderDetailId: 18,
        productId: 1,
        productName: "Xi măng Hà Tiên PCB40",
        saleItemId: 1,
        unit: "Bao (50kg)",
        quantity: 200,
        unitPrice: 93000,
        discount: 0,
        amount: 18600000,
        totalPrice: 18600000,
      },
      {
        orderDetailId: 19,
        productId: 5,
        productName: "Dịch vụ cắt sắt",
        saleItemId: 10,
        unit: "Lần",
        quantity: 5,
        unitPrice: 300000,
        discount: 0,
        amount: 1500000,
        totalPrice: 1500000,
      },
    ],
    payments: [
      { method: "cash", amount: 15000000 },
      { method: "bank", amount: 5100000 },
    ],
  },
};

// Default detail builder for orders without specific mock detail
function buildDefaultDetail(record: OrderRecord): OrderFull {
  return {
    ...record,
    items: [
      {
        orderDetailId: 100 + record.orderId,
        productId: 1,
        productName: "Xi măng Hà Tiên PCB40",
        saleItemId: 1,
        unit: "Bao (50kg)",
        quantity: Math.ceil(record.totalAmount / 95000),
        unitPrice: 95000,
        discount: 0,
        amount: record.totalAmount,
        totalPrice: record.totalAmount,
      },
    ],
    payments: [
      {
        method:
          record.paymentType === "mixed"
            ? "cash"
            : record.paymentType === "debt"
              ? "debt"
              : (record.paymentType as "cash" | "bank"),
        amount: record.paidAmount,
      },
    ],
  };
}

// Simulates network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Fetch orders with filters and pagination
 */
export async function getOrders(
  filters: OrderFilters,
): Promise<ApiResponse<OrderPagination>> {
  // Mock implementation
  await delay(400);

  let filtered = [...MOCK_ORDERS];

  if (filters.Status) {
    filtered = filtered.filter((o) => o.status === filters.Status);
  }
  if (filters.PaymentType) {
    filtered = filtered.filter((o) => o.paymentType === filters.PaymentType);
  }
  if (filters.SearchQuery) {
    const q = filters.SearchQuery.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(q) ||
        o.createdByUserName.toLowerCase().includes(q) ||
        (o.debtorName && o.debtorName.toLowerCase().includes(q)) ||
        (o.note && o.note.toLowerCase().includes(q)),
    );
  }

  const pageNumber = filters.PageNumber ?? 1;
  const pageSize = filters.PageSize ?? 10;
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIdx = (pageNumber - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return {
    data: {
      items,
      pageNumber,
      pageSize,
      totalPages,
      totalCount,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    },
    success: true,
    messageCode: "SUCCESS",
    message: "Lấy danh sách đơn hàng thành công",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch order detail by ID
 */
export async function getOrderDetail(
  orderId: number,
): Promise<ApiResponse<OrderFull>> {
  await delay(300);

  const record = MOCK_ORDERS.find((o) => o.orderId === orderId);
  if (!record) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  const detail = MOCK_ORDER_DETAILS[orderId] ?? buildDefaultDetail(record);

  return {
    data: detail,
    success: true,
    messageCode: "SUCCESS",
    message: "Lấy chi tiết đơn hàng thành công",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a new order
 */
export async function createOrder(
  data: CreateOrderRequest,
): Promise<ApiResponse<OrderRecord>> {
  await delay(500);

  const newOrder: OrderRecord = {
    orderId: MOCK_ORDERS.length + 1,
    orderCode: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(MOCK_ORDERS.length + 1).padStart(3, "0")}`,
    status: "pending",
    businessLocationId: data.businessLocationId,
    businessLocationName: "Cửa hàng Minh Phát",
    paymentType: data.paymentType,
    paymentStatus: data.paymentType === "debt" ? "UNPAID" : "PAID",
    debtorId: data.debtorId,
    subTotal: 0,
    discount: 0,
    totalAmount: 0,
    cashAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    paidAmount: 0,
    isFromAI: false,
    note: data.note,
    createdByUserId: "u-owner-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: new Date().toISOString(),
  };

  return {
    data: newOrder,
    success: true,
    messageCode: "CREATED",
    message: "Tạo đơn hàng thành công",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Confirm a draft order
 */
export async function confirmOrder(
  orderId: number,
  data: ConfirmOrderRequest,
): Promise<ApiResponse<OrderRecord>> {
  await delay(400);

  const order = MOCK_ORDERS.find((o) => o.orderId === orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  return {
    data: { ...order, status: "pending", paymentType: data.paymentType },
    success: true,
    messageCode: "CONFIRMED",
    message: "Xác nhận đơn hàng thành công",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: number,
): Promise<ApiResponse<OrderRecord>> {
  await delay(400);

  const order = MOCK_ORDERS.find((o) => o.orderId === orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  return {
    data: { ...order, status: "cancelled" },
    success: true,
    messageCode: "CANCELLED",
    message: "Hủy đơn hàng thành công",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Complete an order (PENDING → COMPLETED)
 */
export async function completeOrder(
  orderId: number,
): Promise<ApiResponse<OrderRecord>> {
  await delay(400);

  const order = MOCK_ORDERS.find((o) => o.orderId === orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  return {
    data: {
      ...order,
      status: "completed",
      paidAmount: order.totalAmount,
      paymentStatus: "PAID",
    },
    success: true,
    messageCode: "COMPLETED",
    message: "Hoàn thành đơn hàng thành công",
    timestamp: new Date().toISOString(),
  };
}
