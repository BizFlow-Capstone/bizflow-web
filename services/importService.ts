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
  ImportRecord,
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

  const result = (await response.json()) as ApiResponse<ImportPagination>;
  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          items: (result.data.items ?? []).map((item) => ({
            ...item,
            status:
              typeof item.status === "object" && item.status !== null
                ? ((item.status as { code: string })
                    .code as ImportRecord["status"])
                : item.status,
            importType:
              typeof item.importType === "object" && item.importType !== null
                ? ((item.importType as { code: string })
                    .code as ImportRecord["importType"])
                : item.importType,
          })),
        }
      : result.data,
  };
}

export async function getAllImports(
  filters: ImportFilters,
): Promise<ApiResponse<ImportPagination>> {
  const pageSize = 100;
  const firstPage = await getImports({
    ...filters,
    PageNumber: 1,
    PageSize: pageSize,
  });

  const firstData = firstPage.data;
  const totalPages = Math.max(firstData.totalPages ?? 1, 1);
  const allItems: ImportRecord[] = [...(firstData.items ?? [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await getImports({
      ...filters,
      PageNumber: page,
      PageSize: pageSize,
    });
    allItems.push(...(nextPage.data.items ?? []));
  }

  return {
    ...firstPage,
    data: {
      ...firstData,
      items: allItems,
      totalCount: firstData.totalCount ?? allItems.length,
      pageNumber: 1,
      pageSize: allItems.length || pageSize,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
}

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

  const result = (await response.json()) as ApiResponse<ImportDetail>;
  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          status:
            typeof result.data.status === "object" &&
            result.data.status !== null
              ? ((result.data.status as { code: string })
                  .code as ImportDetail["status"])
              : result.data.status,
          importType:
            typeof result.data.importType === "object" &&
            result.data.importType !== null
              ? ((result.data.importType as { code: string })
                  .code as ImportDetail["importType"])
              : result.data.importType,
        }
      : result.data,
  };
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
