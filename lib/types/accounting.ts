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
  | "other"
  | "manual";

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
  paymentMethod?: "cash" | "bank";
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateManualCostRequest {
  businessLocationId: number;
  costType: CostType;
  description: string;
  amount: number;
  costDate: string;
  paymentMethod: "cash" | "bank";
  image?: File;
}

export interface UpdateManualCostRequest {
  description: string;
  amount?: number;
  costDate?: string;
  paymentMethod?: "cash" | "bank";
  removeDocument?: boolean;
  image?: File;
}

export interface CostReferenceCatalog {
  costTypes: CostType[];
  paymentMethods: Array<"cash" | "bank">;
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
  moneyChannel?: "cash" | "bank" | "debt";
  paymentMethod?: "cash" | "bank" | "debt" | "mixed";
  documentUrl?: string;
  createdBy?: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface RevenueFilters {
  locationId: number;
  revenueType?: RevenueType;
  moneyChannel?: "cash" | "bank" | "debt";
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateManualRevenueRequest {
  businessLocationId: number;
  amount: number;
  revenueDate: string;
  description: string;
  moneyChannel: "cash" | "bank";
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

export type StandardPeriodType = "quarter" | "year";
export type PeriodType = StandardPeriodType | "custom";
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
  periodType: StandardPeriodType;
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
  taxProfileKey?: string;
  businessTypes?: Array<{ businessTypeId: string; name: string }>;
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

export interface AccountingBookSectionColumn {
  fieldCode: string;
  label: string;
  fieldType: string;
  exportColumn?: string;
}

export interface AccountingBookSectionDataFilter {
  businessTypeId?: string;
  section?: string;
}

export interface AccountingBookSectionTaxMetadata {
  taxType: string;
  rate: number;
  source: string;
}

export interface AccountingBookSectionRow {
  lineType: string;
  values: Record<string, unknown>;
  dataFilter?: AccountingBookSectionDataFilter;
  taxMetadata?: AccountingBookSectionTaxMetadata;
  explanation?: string;
}

export interface AccountingBookSection {
  sectionType: string;
  businessTypeId?: string;
  businessTypeName?: string;
  groupIndex: number;
  rows: AccountingBookSectionRow[];
}

export interface AccountingBookSections {
  bookId: number;
  templateCode: BookType;
  templateName: string;
  lastCalculatedAt: string;
  columns: AccountingBookSectionColumn[];
  sections: AccountingBookSection[];
  footerRows: AccountingBookSectionRow[];
}

// ═══ General Ledger Entry ═══

export type GLReferenceType =
  | "order"
  | "import"
  | "cost"
  | "revenue"
  | "debtor_payment"
  | "debt_payment"
  | "manual";

export interface GLEntry {
  entryId: number;
  businessLocationId: number;
  referenceType: GLReferenceType;
  referenceId?: number;
  transactionType?: string;
  moneyChannel: "cash" | "bank" | "debt";
  debitAmount: number;
  creditAmount: number;
  description: string;
  entryDate: string;
  createdAt: string;
}

export type GLViewMode = "audit" | "effective";

export type GLEffectiveStatus = "active" | "reversal" | "reversed";

export interface GLEntrySource {
  referenceType: string;
  referenceId?: number | null;
  entityType?: string | null;
  entityId?: number | null;
}

export interface GLEntryListItem extends GLEntry {
  transactionType: string;
  isReversal: boolean;
  reversedEntryId?: number | null;
  source?: GLEntrySource | null;
  isReversed: boolean;
  reversalEntryId?: number | null;
  reversalCount: number;
  effectiveStatus: GLEffectiveStatus;
  historyChainEntryIds: number[];
}

export interface GLEntryPagination {
  items: GLEntryListItem[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GLEntryFilters {
  locationId: number;
  transactionTypes?: string[];
  referenceTypes?: string[];
  moneyChannels?: Array<"cash" | "bank" | "debt">;
  fromDate?: string;
  toDate?: string;
  viewMode?: GLViewMode;
  pageNumber?: number;
  pageSize?: number;
}

export interface GLReferenceCatalog {
  transactionTypes: string[];
  referenceTypes: string[];
  viewModes: GLViewMode[];
  moneyChannels: Array<"cash" | "bank" | "debt">;
}
