// Types for Debtor / Khách hàng thân thiết

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// --- Debtor Record (list view) ---

export interface DebtorRecord {
  debtorId: number;
  businessLocationId: number;
  businessLocationName: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  creditLimit?: number; // null = unlimited
  currentBalance: number; // Negative = owes, Positive = credit, 0 = cleared
  outstandingDebt: number; // abs(min(0, balance))
  isActive: boolean;
  lastOrderDate?: string;
  lastPaymentDate?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
}

// --- Debtor Full Detail ---

export interface DebtorRecentOrder {
  orderId: number;
  orderCode: string;
  orderDate: string;
  totalAmount: number;
  debtAmount: number;
  paidAmount: number;
  status: "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED";
}

export interface DebtorPaymentTransaction {
  transactionId: number;
  debtorId: number;
  amount: number;
  paymentMethod: "cash" | "bank";
  notes?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdByUserName: string;
  paidAt: string;
}

export interface DebtorStatistics {
  totalOrders: number;
  totalPurchaseAmount: number;
  totalPaidAmount: number;
  oldestUnpaidOrder?: string;
}

export interface DebtorFull extends DebtorRecord {
  recentOrders: DebtorRecentOrder[];
  recentPayments: DebtorPaymentTransaction[];
  statistics: DebtorStatistics;
}

// --- Pagination ---

export interface DebtorPagination {
  items: DebtorRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  totalDebt: number; // Total outstanding debt across all debtors
}

// --- Filters ---

export interface DebtorFilters {
  locationId?: number;
  hasDebt?: boolean;
  search?: string;
  sortBy?: "name" | "balance" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// --- Create / Update ---

export interface CreateDebtorRequest {
  businessLocationId: number;
  name: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateDebtorRequest {
  name?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}

// --- Record Payment ---

export interface RecordPaymentRequest {
  amount: number;
  paymentMethod: "cash" | "bank";
  notes?: string;
}

export interface RecordPaymentResponse {
  transactionId: number;
  debtorId: number;
  amount: number;
  paymentMethod: "cash" | "bank";
  balanceBefore: number;
  balanceAfter: number;
  outstandingDebtAfter: number;
  paidAt: string;
  createdByUserName: string;
}

// --- Summary ---

export interface DebtSummary {
  totalDebtors: number;
  debtorsWithDebt: number;
  debtorsWithCredit: number;
  totalOutstandingDebt: number;
  totalCredit: number;
  netDebt: number;
}

// --- Balance Status helpers ---

export type BalanceStatus = "DEBT" | "CREDIT" | "CLEARED";

export function getBalanceStatus(balance: number): BalanceStatus {
  if (balance < 0) return "DEBT";
  if (balance > 0) return "CREDIT";
  return "CLEARED";
}
