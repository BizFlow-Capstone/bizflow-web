// Types for Report & Accounting module

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// ═══ Cost Types ═══

export type CostType =
  | "import"
  | "salary"
  | "rent"
  | "utilities"
  | "transport"
  | "marketing"
  | "maintenance"
  | "other";

export interface CostRecord {
  costId: number;
  businessLocationId: number;
  costType: CostType;
  importId?: number;
  description: string;
  amount: number;
  costDate: string;
  paymentMethod?: "cash" | "bank";
  documentUrl?: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CostPagination {
  items: CostRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CostFilters {
  locationId: number;
  costType?: CostType;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ═══ Revenue Types ═══

export type RevenueType = "sale" | "manual";

export interface RevenueRecord {
  revenueId: number;
  businessLocationId: number;
  revenueType: RevenueType;
  orderId?: number;
  description: string;
  amount: number;
  revenueDate: string;
  paymentMethod?: "cash" | "bank" | "debt" | "mixed";
  documentUrl?: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface RevenuePagination {
  items: RevenueRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ═══ Cash Flow ═══

export interface CashFlowSummary {
  channel: "cash" | "bank" | "debt";
  totalIn: number;
  totalOut: number;
  net: number;
}

export interface CashFlowReport {
  startDate: string;
  endDate: string;
  channels: CashFlowSummary[];
}

// ═══ Accounting Period ═══

export type PeriodType = "quarter" | "year";
export type PeriodStatus = "open" | "finalized" | "reopened";

export interface AccountingPeriod {
  periodId: number;
  businessLocationId: number;
  periodType: PeriodType;
  year: number;
  quarter?: number;
  startDate: string;
  endDate: string;
  openingCashBalance?: number;
  openingBankBalance?: number;
  status: PeriodStatus;
  finalizedAt?: string;
  finalizedByUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PeriodAuditLog {
  logId: number;
  periodId: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdByUserId?: string;
  createdByUserName?: string;
  createdAt: string;
}

export interface CreatePeriodRequest {
  periodType: PeriodType;
  year: number;
  quarter?: number;
  openingCashBalance?: number;
  openingBankBalance?: number;
  useSuggestedOpeningBalances?: boolean;
}

export interface CreateCustomPeriodRequest {
  startDate: string;
  endDate: string;
  openingCashBalance?: number;
  openingBankBalance?: number;
  useSuggestedOpeningBalances?: boolean;
}

export interface OpeningBalanceSuggestionRequest {
  periodType: "quarter" | "year" | "custom";
  year?: number;
  quarter?: number;
  startDate?: string;
}

export interface OpeningBalanceSuggestion {
  hasSuggestion: boolean;
  suggestionReason: string;
  calculationExplanation?: string;
  openingCashBalance?: number;
  openingBankBalance?: number;
  sourcePeriodId?: number;
  sourceStartDate?: string;
  sourceEndDate?: string;
  calculationBreakdown?: {
    previousOpeningCashBalance: number;
    previousOpeningBankBalance: number;
    netCashInSourcePeriod: number;
    netBankInSourcePeriod: number;
    suggestedOpeningCashBalance: number;
    suggestedOpeningBankBalance: number;
  };
}

export interface ReopenPeriodRequest {
  reason: string;
}

// ═══ Accounting Book ═══

export type BookType = "S1a" | "S2a" | "S2b" | "S2c" | "S2d" | "S2e";

export interface AccountingTemplate {
  templateId: number;
  templateCode: BookType;
  name: string;
  description?: string;
  applicableGroups: number[];
  applicableMethods?: string[];
  isActive: boolean;
}

export interface AccountingBook {
  bookId: number;
  periodId: number;
  templateCode: BookType;
  templateName: string;
  groupNumber: number;
  taxMethod?: string;
  status: "active" | "archived";
  createdAt: string;
}

export interface AccountingExport {
  exportId: number;
  bookId: number;
  format: "xlsx" | "pdf";
  fileUrl: string;
  createdAt: string;
}

// ═══ General Ledger Entry ═══

export type GLReferenceType =
  | "order"
  | "import"
  | "cost"
  | "revenue"
  | "debt_payment"
  | "manual";

export interface GLEntry {
  entryId: number;
  businessLocationId: number;
  referenceType: GLReferenceType;
  referenceId?: number;
  moneyChannel: "cash" | "bank" | "debt";
  debitAmount: number;
  creditAmount: number;
  description: string;
  entryDate: string;
  createdAt: string;
}
