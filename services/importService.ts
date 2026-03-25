/**
 * Import Service
 * Pure API calling logic - no React hooks here
 *
 * Flow: Service → API Route → Backend
 */

import type {
  ApiResponse,
  ImportPagination,
  ImportDetail,
  ImportFilters,
  CreateImportRequest,
  CreateImportResponse,
  UpdateImportRequest,
  ConfirmImportRequest,
  ConfirmImportResponse,
  ImportTemplate,
} from "@/lib/types/import";
import { authFetch } from "@/lib/auth/tokenManager";

function buildImportFormData(
  data: CreateImportRequest | UpdateImportRequest,
): FormData {
  const formData = new FormData();

  if (data.importType) formData.append("ImportType", data.importType);
  if (data.hasInvoice !== undefined)
    formData.append("HasInvoice", String(data.hasInvoice));
  if ("businessLocationId" in data && data.businessLocationId) {
    formData.append("BusinessLocationId", String(data.businessLocationId));
  }
  if (data.supplier) formData.append("Supplier", data.supplier);
  if (data.note) formData.append("Note", data.note);
  if (data.receivedAt) formData.append("ReceivedAt", data.receivedAt);
  if (data.saveAsDraft !== undefined)
    formData.append("SaveAsDraft", String(data.saveAsDraft));

  if (Array.isArray(data.items)) {
    // Backend expects Items as JSON string for multipart requests
    formData.append("Items", JSON.stringify(data.items));
  }

  if (data.image) {
    formData.append("image", data.image);
  }

  return formData;
}

/**
 * Fetch imports with filters and pagination
 */
export async function getImports(
  filters: ImportFilters,
): Promise<ApiResponse<ImportPagination>> {
  const params = new URLSearchParams();

  if (filters.Status) params.append("Status", filters.Status);
  if (filters.ImportType) params.append("ImportType", filters.ImportType);
  if (filters.HasInvoice !== undefined)
    params.append("HasInvoice", String(filters.HasInvoice));
  if (filters.BusinessLocationId)
    params.append("BusinessLocationId", String(filters.BusinessLocationId));
  if (filters.FromDate) params.append("FromDate", filters.FromDate);
  if (filters.ToDate) params.append("ToDate", filters.ToDate);
  if (filters.PageNumber)
    params.append("PageNumber", String(filters.PageNumber));
  if (filters.PageSize) params.append("PageSize", String(filters.PageSize));

  const response = await authFetch(`/api/imports?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch imports: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch import detail by ID
 */
export async function getImportDetail(
  importId: number,
): Promise<ApiResponse<ImportDetail>> {
  const response = await authFetch(`/api/imports/${importId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch import detail: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new import
 */
export async function createImport(
  data: CreateImportRequest,
): Promise<ApiResponse<CreateImportResponse>> {
  const options: RequestInit = {
    method: "POST",
  };

  if (data.image) {
    options.body = buildImportFormData(data);
    // Let browser set the correct multipart boundary
  } else {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(data);
  }

  const response = await authFetch("/api/imports", options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to create import: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Update a DRAFT import
 */
export async function updateImport(
  importId: number,
  data: UpdateImportRequest,
): Promise<ApiResponse<ImportDetail>> {
  const options: RequestInit = {
    method: "PUT",
  };

  if (data.image) {
    options.body = buildImportFormData(data);
  } else {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(data);
  }

  const response = await authFetch(`/api/imports/${importId}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to update import: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Confirm a DRAFT import (updates stock)
 */
export async function confirmImport(
  importId: number,
  data: ConfirmImportRequest,
): Promise<ApiResponse<ConfirmImportResponse>> {
  const response = await authFetch(`/api/imports/${importId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to confirm import: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Delete/cancel an import
 * DRAFT → hard delete, CONFIRMED → soft cancel (stock reversed)
 */
export async function deleteImport(
  importId: number,
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/imports/${importId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to delete import: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Get import template schema
 */
export async function getImportTemplate(): Promise<
  ApiResponse<ImportTemplate>
> {
  const response = await authFetch("/api/imports/template", {
    method: "GET",
    headers: {
      accept: "*/*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch import template: ${response.status}`);
  }

  return response.json();
}
