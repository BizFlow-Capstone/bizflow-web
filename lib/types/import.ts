// Types for Import (Nhập kho) API

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// --- Import Item ---

export interface ImportItem {
  productId: number;
  productName?: string;
  quantity: number;
  baseUnit?: string;
  costPrice: number;
  totalPrice?: number;
  currentStock?: number;
}

export interface ImportItemRequest {
  productId: number;
  quantity: number;
  costPrice: number;
}

// --- Import Record ---

export type ImportStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type ImportType = "INVOICE" | "NO-INVOICE";

export interface ImportRecord {
  importId: number;
  importCode: string;
  importType: ImportType;
  status: ImportStatus;
  businessLocationId: number;
  businessLocationName: string;
  supplier?: string;
  note?: string;
  receivedAt?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportDetail extends ImportRecord {
  items: ImportItem[];
}

// --- Pagination ---

export interface ImportPagination {
  items: ImportRecord[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// --- Filters ---

export interface ImportFilters {
  Status?: ImportStatus;
  ImportType?: ImportType;
  BusinessLocationId?: number;
  FromDate?: string;
  ToDate?: string;
  PageNumber?: number;
  PageSize?: number;
}

// --- Create Import Request ---

export interface CreateImportRequest {
  importType: ImportType;
  businessLocationId: number;
  supplier?: string;
  note?: string;
  receivedAt?: string;
  saveAsDraft?: boolean;
  items: ImportItemRequest[];
}

// --- Update Import Request ---

export interface UpdateImportRequest {
  importType?: ImportType;
  supplier?: string;
  note?: string;
  receivedAt?: string;
  items?: ImportItemRequest[];
}

// --- Confirm Import Request ---

export interface ConfirmImportRequest {
  receivedAt: string;
}

// --- Import Template ---

export interface ImportTemplate {
  schemaJson: string;
}

// --- Create Import Response ---

export interface CreateImportResponse {
  importId: number;
  importCode: string;
  importType: ImportType;
  status: ImportStatus;
  businessLocationId: number;
  businessLocationName: string;
  supplier?: string;
  note?: string;
  totalAmount: number;
  createdAt: string;
}

// --- Confirm Import Response ---

export interface ConfirmImportResponse {
  importId: number;
  importCode: string;
  status: ImportStatus;
  receivedAt: string;
  updatedAt: string;
}
