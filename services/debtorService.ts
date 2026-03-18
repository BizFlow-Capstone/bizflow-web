import type {
  ApiResponse,
  DebtorRecord,
  DebtorFull,
  DebtorPagination,
  DebtorFilters,
  CreateDebtorRequest,
  UpdateDebtorRequest,
  UpdateDebtorStatusRequest,
  RecordPaymentRequest,
  RecordPaymentResponse,
  DebtSummary,
  DeleteDebtorOptions,
  DebtorPaymentTransaction,
} from "@/lib/types/debtor";
import { authFetch } from "@/lib/auth/tokenManager";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toDateString(value: unknown): string {
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function mapDebtorRecord(raw: Record<string, unknown>): DebtorRecord {
  const currentBalance = toNumber(raw.currentBalance);
  const outstandingDebt = Math.abs(Math.min(0, currentBalance));

  return {
    debtorId: toNumber(raw.debtorId),
    businessLocationId: toNumber(raw.businessLocationId),
    businessLocationName:
      typeof raw.businessLocationName === "string"
        ? raw.businessLocationName
        : "—",
    name: typeof raw.name === "string" ? raw.name : "Khách hàng",
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    address: typeof raw.address === "string" ? raw.address : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    creditLimit:
      raw.creditLimit === null || raw.creditLimit === undefined
        ? undefined
        : toNumber(raw.creditLimit),
    currentBalance,
    outstandingDebt,
    isActive: Boolean(raw.isActive),
    lastOrderDate:
      typeof raw.lastOrderDate === "string" ? raw.lastOrderDate : undefined,
    lastPaymentDate:
      typeof raw.lastPaymentDate === "string" ? raw.lastPaymentDate : undefined,
    createdByUserId:
      typeof raw.createdByUserId === "string" ? raw.createdByUserId : undefined,
    createdByUserName:
      typeof raw.createdByUserName === "string"
        ? raw.createdByUserName
        : undefined,
    createdAt: toDateString(raw.createdAt),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

async function throwApiError(
  response: Response,
  fallback: string,
): Promise<never> {
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;
  throw new Error(payload?.message || fallback);
}

function buildDebtorQuery(filters: DebtorFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.businessLocationIds && filters.businessLocationIds.length > 0) {
    const cleanedIds = filters.businessLocationIds.filter(
      (id) => Number.isFinite(id) && id > 0,
    );
    if (cleanedIds.length > 0) {
      params.append("BusinessLocationIds", `[${cleanedIds.join(",")}]`);
    }
  } else if (filters.locationId) {
    params.append("BusinessLocationIds", `[${filters.locationId}]`);
  }

  if (filters.search) params.append("Search", filters.search);
  if (filters.isActive !== undefined)
    params.append("IsActive", String(filters.isActive));
  if (filters.hasDebt !== undefined)
    params.append("HasDebt", String(filters.hasDebt));
  if (filters.sortBy) params.append("SortBy", filters.sortBy);
  if (filters.sortDir) params.append("SortDir", filters.sortDir);
  if (filters.page) params.append("PageNumber", String(filters.page));
  if (filters.pageSize) params.append("PageSize", String(filters.pageSize));

  return params;
}

export async function getDebtors(
  filters: DebtorFilters,
): Promise<ApiResponse<DebtorPagination>> {
  const query = buildDebtorQuery(filters).toString();
  const url = query ? `/api/debtors?${query}` : "/api/debtors";

  const response = await authFetch(url, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to fetch debtors: ${response.status}`,
    );
  }

  const payload = (await response.json()) as ApiResponse<{
    items?: Record<string, unknown>[];
    page?: number;
    pageNumber?: number;
    pageSize?: number;
    totalPages?: number;
    totalCount?: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
  }>;

  const pagePayload = payload.data ?? {};
  const items = (pagePayload.items ?? []).map(mapDebtorRecord);
  const page = toNumber(pagePayload.page ?? pagePayload.pageNumber, 1);
  const pageSize = toNumber(pagePayload.pageSize, 20);
  const totalCount = toNumber(pagePayload.totalCount, items.length);
  const totalPages = toNumber(
    pagePayload.totalPages,
    Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1))),
  );
  const totalDebt = items
    .filter((item) => item.currentBalance < 0)
    .reduce((sum, item) => sum + item.outstandingDebt, 0);

  return {
    ...payload,
    data: {
      items,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasPreviousPage:
        pagePayload.hasPreviousPage ?? (page > 1 && totalPages > 1),
      hasNextPage: pagePayload.hasNextPage ?? page < totalPages,
      totalDebt,
    },
  };
}

export async function getDebtorDetail(
  debtorId: number,
): Promise<ApiResponse<DebtorFull>> {
  const response = await authFetch(`/api/debtors/${debtorId}`, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to fetch debtor detail: ${response.status}`,
    );
  }

  const payload = (await response.json()) as ApiResponse<
    Record<string, unknown>
  >;
  const detailRaw = payload.data ?? {};

  const detail: DebtorFull = {
    ...mapDebtorRecord(detailRaw),
    recentOrders: Array.isArray(detailRaw.recentOrders)
      ? (detailRaw.recentOrders as DebtorFull["recentOrders"])
      : [],
    recentPayments: Array.isArray(detailRaw.recentPayments)
      ? (detailRaw.recentPayments as DebtorFull["recentPayments"])
      : [],
    statistics:
      typeof detailRaw.statistics === "object" && detailRaw.statistics !== null
        ? {
            totalOrders: toNumber(
              (detailRaw.statistics as Record<string, unknown>).totalOrders,
            ),
            totalPurchaseAmount: toNumber(
              (detailRaw.statistics as Record<string, unknown>)
                .totalPurchaseAmount,
            ),
            totalPaidAmount: toNumber(
              (detailRaw.statistics as Record<string, unknown>).totalPaidAmount,
            ),
            oldestUnpaidOrder:
              typeof (detailRaw.statistics as Record<string, unknown>)
                .oldestUnpaidOrder === "string"
                ? ((detailRaw.statistics as Record<string, unknown>)
                    .oldestUnpaidOrder as string)
                : undefined,
          }
        : {
            totalOrders: 0,
            totalPurchaseAmount: 0,
            totalPaidAmount: 0,
          },
  };

  return {
    ...payload,
    data: detail,
  };
}

export async function createDebtor(
  request: CreateDebtorRequest,
): Promise<ApiResponse<DebtorRecord>> {
  const response = await authFetch("/api/debtors", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to create debtor: ${response.status}`,
    );
  }

  const payload = (await response.json()) as ApiResponse<
    Record<string, unknown>
  >;
  return {
    ...payload,
    data: mapDebtorRecord(payload.data ?? {}),
  };
}

export async function updateDebtor(
  debtorId: number,
  request: UpdateDebtorRequest,
): Promise<ApiResponse<DebtorRecord>> {
  const response = await authFetch(`/api/debtors/${debtorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to update debtor: ${response.status}`,
    );
  }

  const payload = (await response.json()) as ApiResponse<
    Record<string, unknown>
  >;
  return {
    ...payload,
    data: mapDebtorRecord(payload.data ?? {}),
  };
}

export async function updateDebtorStatus(
  debtorId: number,
  request: UpdateDebtorStatusRequest,
): Promise<ApiResponse<DebtorRecord>> {
  const response = await authFetch(`/api/debtors/${debtorId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to update debtor status: ${response.status}`,
    );
  }

  const payload = (await response.json()) as ApiResponse<
    Record<string, unknown>
  >;
  return {
    ...payload,
    data: mapDebtorRecord(payload.data ?? {}),
  };
}

export async function deleteDebtor(
  debtorId: number,
  options?: DeleteDebtorOptions,
): Promise<ApiResponse<null>> {
  const query = new URLSearchParams();
  if (options?.force !== undefined) {
    query.set("force", String(options.force));
  }
  const url = query.toString()
    ? `/api/debtors/${debtorId}?${query.toString()}`
    : `/api/debtors/${debtorId}`;

  const response = await authFetch(url, {
    method: "DELETE",
    headers: { accept: "*/*" },
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to delete debtor: ${response.status}`,
    );
  }

  return response.json();
}

export async function recordPayment(
  debtorId: number,
  request: RecordPaymentRequest,
): Promise<ApiResponse<RecordPaymentResponse>> {
  const response = await authFetch(`/api/debtors/${debtorId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to record payment: ${response.status}`,
    );
  }

  return response.json();
}

export async function getDebtorPayments(
  debtorId: number,
): Promise<ApiResponse<DebtorPaymentTransaction[]>> {
  const response = await authFetch(`/api/debtors/${debtorId}/payments`, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!response.ok) {
    return throwApiError(
      response,
      `Failed to fetch debtor payments: ${response.status}`,
    );
  }

  return response.json();
}

export async function getDebtSummary(): Promise<ApiResponse<DebtSummary>> {
  const summaryResponse = await authFetch("/api/debtors/summary", {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (summaryResponse.ok) {
    return summaryResponse.json();
  }

  // Fallback: derive summary from list endpoint when summary API is not ready.
  const debtorsResponse = await getDebtors({ page: 1, pageSize: 200 });
  const debtors = debtorsResponse.data.items;
  const debtorsWithDebt = debtors.filter((item) => item.currentBalance < 0);
  const debtorsWithCredit = debtors.filter((item) => item.currentBalance > 0);
  const totalOutstandingDebt = debtorsWithDebt.reduce(
    (sum, item) => sum + item.outstandingDebt,
    0,
  );
  const totalCredit = debtorsWithCredit.reduce(
    (sum, item) => sum + item.currentBalance,
    0,
  );

  return {
    data: {
      totalDebtors: debtors.length,
      debtorsWithDebt: debtorsWithDebt.length,
      debtorsWithCredit: debtorsWithCredit.length,
      totalOutstandingDebt,
      totalCredit,
      netDebt: totalOutstandingDebt - totalCredit,
    },
    success: true,
    messageCode: "COMMON_DATA_RETRIEVED",
    message: "Data retrieved successfully",
    timestamp: new Date().toISOString(),
  };
}
