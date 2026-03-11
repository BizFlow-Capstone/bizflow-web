// Types for Order (Đơn hàng) API

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// --- Order Status ---

export type OrderStatus = "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED";

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
  businessLocationName: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  debtorId?: number;
  debtorName?: string;
  totalAmount: number;
  paidAmount: number;
  note?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
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
  productId: number;
  saleItemId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  businessLocationId: number;
  paymentType: PaymentType;
  debtorId?: number;
  note?: string;
  items: CreateOrderItemRequest[];
  payments?: PaymentSplit[];
}

// --- Confirm Order Request ---

export interface ConfirmOrderRequest {
  paymentType: PaymentType;
  debtorId?: number;
  payments?: PaymentSplit[];
}

// --- Draft Order (localStorage "treo đơn") ---

export interface DraftOrderItem {
  productId: number;
  name: string;
  unit: string;
  price: number;
  quantity: number;
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
