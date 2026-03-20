import { authFetch } from "@/lib/auth/tokenManager";
import type {
  ApiResponse,
  CashFlowReport,
  CostPagination,
  CostFilters,
  RevenuePagination,
  AccountingPeriod,
  CreatePeriodRequest,
  CreateCustomPeriodRequest,
  OpeningBalanceSuggestion,
  OpeningBalanceSuggestionRequest,
  PeriodAuditLog,
  AccountingTemplate,
  AccountingBook,
  CostRecord,
} from "@/lib/types/accounting";
import type { ImportPagination, ImportRecord } from "@/lib/types/import";

const DEFAULT_EMPTY_REVENUE: RevenuePagination = {
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 0,
};

const DEFAULT_EMPTY_TEMPLATE_RESPONSE: ApiResponse<AccountingTemplate[]> = {
  data: [],
  success: true,
  messageCode: "COMMON_DATA_RETRIEVED",
  message: "Data retrieved successfully",
  timestamp: new Date().toISOString(),
};

const DEFAULT_EMPTY_BOOK_RESPONSE: ApiResponse<AccountingBook[]> = {
  data: [],
  success: true,
  messageCode: "COMMON_DATA_RETRIEVED",
  message: "Data retrieved successfully",
  timestamp: new Date().toISOString(),
};

function toAccountingCost(item: ImportRecord): CostRecord {
  return {
    costId: item.importId,
    businessLocationId: item.businessLocationId,
    costType: "import",
    importId: item.importId,
    description: item.note || `Import ${item.importCode}`,
    amount: item.totalAmount,
    costDate: item.receivedAt || item.createdAt,
    createdByUserName: item.confirmedByUserId ? "System" : "Unknown",
    createdAt: item.createdAt,
  };
}

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  const payload = (await response.json()) as ApiResponse<T>;
  return payload;
}

export async function getCosts(
  filters: CostFilters,
): Promise<ApiResponse<CostPagination>> {
  const params = new URLSearchParams();
  params.append("BusinessLocationId", String(filters.locationId));
  params.append("Status", "CONFIRMED");

  if (filters.fromDate) params.append("FromDate", filters.fromDate);
  if (filters.toDate) params.append("ToDate", filters.toDate);
  if (filters.pageNumber)
    params.append("PageNumber", String(filters.pageNumber));
  if (filters.pageSize) params.append("PageSize", String(filters.pageSize));

  const response = await authFetch(`/api/imports?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounting costs: ${response.status}`);
  }

  const result = await parseApiResponse<ImportPagination>(response);
  const mappedItems = (result.data?.items ?? []).map(toAccountingCost);

  return {
    ...result,
    data: {
      items: mappedItems,
      totalCount: result.data?.totalCount ?? 0,
      pageNumber: result.data?.pageNumber ?? 1,
      pageSize: result.data?.pageSize ?? 10,
      totalPages: result.data?.totalPages ?? 0,
    },
  };
}

export async function getRevenues(
  _locationId: number,
): Promise<ApiResponse<RevenuePagination>> {
  return {
    data: DEFAULT_EMPTY_REVENUE,
    success: true,
    messageCode: "COMMON_DATA_RETRIEVED",
    message: "Revenue API is not available in current backend controllers yet.",
    timestamp: new Date().toISOString(),
  };
}

export async function getCashFlowReport(
  locationId: number,
  startDate: string,
  endDate: string,
): Promise<ApiResponse<CashFlowReport>> {
  const [costResult, revenueResult] = await Promise.all([
    getCosts({ locationId, fromDate: startDate, toDate: endDate }),
    getRevenues(locationId),
  ]);

  const channels: Record<
    "cash" | "bank" | "debt",
    { totalIn: number; totalOut: number }
  > = {
    cash: { totalIn: 0, totalOut: 0 },
    bank: { totalIn: 0, totalOut: 0 },
    debt: { totalIn: 0, totalOut: 0 },
  };

  for (const revenue of revenueResult.data.items) {
    const channel = revenue.paymentMethod;
    if (channel && channel !== "mixed") {
      channels[channel].totalIn += revenue.amount;
    }
  }

  for (const cost of costResult.data.items) {
    const channel = cost.paymentMethod ?? "cash";
    channels[channel].totalOut += cost.amount;
  }

  return {
    success: true,
    messageCode: "COMMON_DATA_RETRIEVED",
    message: "Data retrieved successfully",
    timestamp: new Date().toISOString(),
    data: {
      startDate,
      endDate,
      channels: (Object.keys(channels) as Array<"cash" | "bank" | "debt">).map(
        (channel) => ({
          channel,
          totalIn: channels[channel].totalIn,
          totalOut: channels[channel].totalOut,
          net: channels[channel].totalIn - channels[channel].totalOut,
        }),
      ),
    },
  };
}

export async function getAccountingPeriods(
  locationId: number,
): Promise<ApiResponse<AccountingPeriod[]>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch accounting periods: ${response.status}`);
  }

  return parseApiResponse<AccountingPeriod[]>(response);
}

export async function createAccountingPeriod(
  locationId: number,
  data: CreatePeriodRequest,
): Promise<ApiResponse<AccountingPeriod>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create accounting period: ${response.status}`);
  }

  return parseApiResponse<AccountingPeriod>(response);
}

export async function createCustomPeriod(
  locationId: number,
  data: CreateCustomPeriodRequest,
): Promise<ApiResponse<AccountingPeriod>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/custom`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create custom accounting period: ${response.status}`,
    );
  }

  return parseApiResponse<AccountingPeriod>(response);
}

export async function getOpeningBalanceSuggestion(
  locationId: number,
  params: OpeningBalanceSuggestionRequest,
): Promise<ApiResponse<OpeningBalanceSuggestion>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/opening-balance-suggestion`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch opening balance suggestion: ${response.status}`,
    );
  }

  return parseApiResponse<OpeningBalanceSuggestion>(response);
}

export async function finalizePeriod(
  locationId: number,
  periodId: number,
): Promise<ApiResponse<AccountingPeriod>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/${periodId}/finalize`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to finalize period: ${response.status}`);
  }

  return parseApiResponse<AccountingPeriod>(response);
}

export async function reopenPeriod(
  locationId: number,
  periodId: number,
  reason: string,
): Promise<ApiResponse<AccountingPeriod>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/${periodId}/reopen`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to reopen period: ${response.status}`);
  }

  return parseApiResponse<AccountingPeriod>(response);
}

export async function getPeriodAuditLogs(
  locationId: number,
  periodId: number,
): Promise<ApiResponse<PeriodAuditLog[]>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/${periodId}/audit-logs`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch period audit logs: ${response.status}`);
  }

  const result = await parseApiResponse<PeriodAuditLog[]>(response);

  return {
    ...result,
    data: (result.data ?? []).map((log) => ({
      ...log,
      createdByUserName:
        log.createdByUserName || log.createdByUserId || "Unknown user",
    })),
  };
}

export async function getAccountingTemplates(): Promise<
  ApiResponse<AccountingTemplate[]>
> {
  return DEFAULT_EMPTY_TEMPLATE_RESPONSE;
}

export async function getAccountingBooks(
  _locationId: number,
  _periodId?: number,
): Promise<ApiResponse<AccountingBook[]>> {
  return DEFAULT_EMPTY_BOOK_RESPONSE;
}
