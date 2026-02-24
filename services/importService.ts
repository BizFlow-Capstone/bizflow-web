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

/**
 * Fetch imports with filters and pagination
 */
export async function getImports(
  filters: ImportFilters,
): Promise<ApiResponse<ImportPagination>> {
  const params = new URLSearchParams();

  if (filters.Status) params.append("Status", filters.Status);
  if (filters.ImportType) params.append("ImportType", filters.ImportType);
  if (filters.BusinessLocationId)
    params.append("BusinessLocationId", String(filters.BusinessLocationId));
  if (filters.FromDate) params.append("FromDate", filters.FromDate);
  if (filters.ToDate) params.append("ToDate", filters.ToDate);
  if (filters.PageNumber)
    params.append("PageNumber", String(filters.PageNumber));
  if (filters.PageSize) params.append("PageSize", String(filters.PageSize));

  const response = await fetch(`/api/imports?${params.toString()}`, {
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
  const response = await fetch(`/api/imports/${importId}`, {
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
  const response = await fetch("/api/imports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

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
  const response = await fetch(`/api/imports/${importId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

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
  const response = await fetch(`/api/imports/${importId}`, {
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
  const response = await fetch(`/api/imports/${importId}`, {
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
  const response = await fetch("/api/imports/template", {
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
