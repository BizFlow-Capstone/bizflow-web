// Types for Order (Đơn hàng) API

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
  warnings?: string[] | null;
}

// --- Order Status ---

export type OrderStatus = "pending" | "completed" | "cancelled";

export type PaymentType = "cash" | "bank" | "debt" | "mixed";

export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

// --- Order Detail (line item) ---

export interface OrderDetail {
  orderDetailId: number;
  productId: number;
  productName: string;
  saleItemId: number;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
  totalPrice: number;
}

// --- Payment Split (for mixed payments) ---

export interface PaymentSplit {
  method: "cash" | "bank" | "debt";
  amount: number;
}

// --- Order Record (list view) ---

export interface OrderRecord {
  orderId: number;
  orderCode: string;
  status: OrderStatus;
  businessLocationId: number;
  businessLocationName?: string;
  refOrderId?: number;
  debtorId?: number;
  debtorName?: string;
  customerName?: string;
  customerPhone?: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  cashAmount: number;
  bankAmount: number;
  debtAmount: number;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  billMetadata?: string;
  note?: string;
  isFromAI: boolean;
  aiConfidence?: number;
  originalTranscript?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReasonCode?: string;
  cancelReason?: string;
}

// --- Order Detail View (full) ---

export interface OrderFull extends OrderRecord {
  items: OrderDetail[];
  payments: PaymentSplit[];
}

// --- Pagination ---

export interface OrderPagination {
  items: OrderRecord[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// --- Filters ---

export interface OrderFilters {
  Status?: OrderStatus;
  PaymentType?: PaymentType;
  BusinessLocationId?: number;
  DebtorId?: number;
  FromDate?: string;
  ToDate?: string;
  SearchQuery?: string;
  PageNumber?: number;
  PageSize?: number;
}

// --- Create Order Request ---

export interface CreateOrderItemRequest {
  saleItemId: number;
  quantity: number;
  discount: number;
}

export interface CreateOrderRequest {
  businessLocationId: number;
  cashAmount: number;
  bankAmount: number;
  debtAmount: number;
  debtorId?: number;
  customerName?: string;
  customerPhone?: string;
  confirmLowStock?: boolean;
  confirmCreditLimitExceeded?: boolean;
  note?: string;
  billMetadata?: string;
  items: CreateOrderItemRequest[];
}

// --- Update Order Request ---

export interface UpdateOrderRequest extends CreateOrderRequest {
  idempotencyKey?: string;
}

export interface ConfirmOrderRequest {
  paymentType: PaymentType;
  debtorId?: number;
  payments?: PaymentSplit[];
}

export interface CancelOrderRequest {
  cancelReason?: string;
}

export interface CompleteOrderRequest {
  confirmLowStock?: boolean;
  excessAmount?: number;
  excessDebtorId?: number;
}

// --- Draft Order (localStorage "treo đơn") ---

export interface DraftOrderItem {
  productId: number;
  saleItemId: number;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  discount: number;
  stock: number;
  trackInventory: boolean;
}

export interface DraftOrder {
  draftId: string;
  items: DraftOrderItem[];
  paymentType: PaymentType;
  debtorId?: number;
  debtorName?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
