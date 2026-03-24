import { authFetch } from "@/lib/auth/tokenManager";
import type {
  ApiResponse,
  CashFlowReport,
  CostPagination,
  CostFilters,
  CostReferenceCatalog,
  CreateManualCostRequest,
  UpdateManualCostRequest,
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
  GLEntryPagination,
  GLEntryFilters,
  GLReferenceCatalog,
  GLViewMode,
  RevenueFilters,
  CreateManualRevenueRequest,
  RevenueRecord,
} from "@/lib/types/accounting";

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

const DEFAULT_GL_VIEW_MODE: GLViewMode = "effective";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeGLDateRange(filters: GLEntryFilters): {
  fromDate: string;
  toDate: string;
} {
  const today = toIsoDate(new Date());
  const toDate = filters.toDate || today;
  const year = Number.parseInt(toDate.slice(0, 4), 10);
  const safeYear = Number.isNaN(year) ? new Date().getFullYear() : year;

  return {
    toDate,
    // Keep GL browsing inside one year when FromDate is omitted.
    fromDate: filters.fromDate || `${safeYear}-01-01`,
  };
}

function appendJsonArrayParam(
  params: URLSearchParams,
  key: string,
  values?: string[],
) {
  if (!values || values.length === 0) return;
  params.append(key, JSON.stringify(values));
}

async function getStringReferenceValues(
  endpoint: string,
): Promise<ApiResponse<string[]>> {
  const response = await authFetch(endpoint, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reference values: ${response.status}`);
  }

  return parseApiResponse<string[]>(response);
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
  if (filters.costType) params.append("CostType", filters.costType);
  if (filters.paymentMethod) {
    params.append("PaymentMethod", filters.paymentMethod);
  }

  if (filters.fromDate) params.append("FromDate", filters.fromDate);
  if (filters.toDate) params.append("ToDate", filters.toDate);
  if (filters.pageNumber)
    params.append("PageNumber", String(filters.pageNumber));
  if (filters.pageSize) params.append("PageSize", String(filters.pageSize));

  const response = await authFetch(`/api/costs?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounting costs: ${response.status}`);
  }

  return parseApiResponse<CostPagination>(response);
}

function toCostFormData(
  data: CreateManualCostRequest | UpdateManualCostRequest,
): FormData {
  const formData = new FormData();

  if ("businessLocationId" in data) {
    formData.append("BusinessLocationId", String(data.businessLocationId));
  }

  if ("costType" in data && data.costType) {
    formData.append("CostType", data.costType);
  }

  if (typeof data.description === "string") {
    formData.append("Description", data.description);
  }

  if (typeof data.amount === "number") {
    formData.append("Amount", String(data.amount));
  }

  if (data.costDate) {
    formData.append("CostDate", data.costDate);
  }

  if (data.paymentMethod) {
    formData.append("PaymentMethod", data.paymentMethod);
  }

  if ("removeDocument" in data && typeof data.removeDocument === "boolean") {
    formData.append("RemoveDocument", String(data.removeDocument));
  }

  if (data.image) {
    formData.append("image", data.image);
  }

  return formData;
}

export async function createManualCost(
  data: CreateManualCostRequest,
): Promise<ApiResponse<CostRecord>> {
  const response = await authFetch(`/api/costs/manual`, {
    method: "POST",
    body: toCostFormData(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create manual cost: ${response.status}`);
  }

  return parseApiResponse<CostRecord>(response);
}

export async function updateManualCost(
  costId: number,
  data: UpdateManualCostRequest,
): Promise<ApiResponse<CostRecord>> {
  const response = await authFetch(`/api/costs/${costId}`, {
    method: "PUT",
    body: toCostFormData(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update manual cost: ${response.status}`);
  }

  return parseApiResponse<CostRecord>(response);
}

export async function deleteManualCost(
  costId: number,
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/costs/${costId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete manual cost: ${response.status}`);
  }

  return parseApiResponse<null>(response);
}

export async function getCostReferenceCatalog(): Promise<
  ApiResponse<CostReferenceCatalog>
> {
  const [costTypesResult, paymentMethodsResult] = await Promise.all([
    getStringReferenceValues(`/api/reference/cost-types`),
    getStringReferenceValues(`/api/reference/payment-methods`),
  ]);

  return {
    success: costTypesResult.success && paymentMethodsResult.success,
    messageCode:
      costTypesResult.messageCode || paymentMethodsResult.messageCode,
    message: costTypesResult.message || paymentMethodsResult.message,
    timestamp: new Date().toISOString(),
    data: {
      costTypes: (costTypesResult.data ??
        []) as CostReferenceCatalog["costTypes"],
      paymentMethods: (paymentMethodsResult.data ??
        []) as CostReferenceCatalog["paymentMethods"],
    },
  };
}

export async function getRevenues(
  locationId: number,
): Promise<ApiResponse<RevenuePagination>> {
  return getRevenuesWithFilters({ locationId });
}

export async function getRevenuesWithFilters(
  filters: RevenueFilters,
): Promise<ApiResponse<RevenuePagination>> {
  const params = new URLSearchParams();
  params.append("BusinessLocationId", String(filters.locationId));

  if (filters.revenueType) {
    params.append("RevenueType", filters.revenueType);
  }

  if (filters.moneyChannel) {
    params.append("MoneyChannel", filters.moneyChannel);
  }

  if (filters.fromDate) params.append("FromDate", filters.fromDate);
  if (filters.toDate) params.append("ToDate", filters.toDate);
  if (filters.pageNumber)
    params.append("PageNumber", String(filters.pageNumber));
  if (filters.pageSize) params.append("PageSize", String(filters.pageSize));

  const response = await authFetch(`/api/revenues?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounting revenues: ${response.status}`);
  }

  const result = await parseApiResponse<RevenuePagination>(response);

  return {
    ...result,
    data: {
      ...DEFAULT_EMPTY_REVENUE,
      ...result.data,
      items: (result.data?.items ?? []).map((item) => ({
        ...item,
        paymentMethod: item.moneyChannel,
        createdByUserName: item.createdBy || item.createdByUserName || "System",
      })) as RevenueRecord[],
    },
  };
}

export async function createManualRevenue(
  data: CreateManualRevenueRequest,
): Promise<ApiResponse<RevenueRecord>> {
  const response = await authFetch(`/api/revenues/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create manual revenue: ${response.status}`);
  }

  const result = await parseApiResponse<RevenueRecord>(response);

  return {
    ...result,
    data: {
      ...result.data,
      paymentMethod: result.data.moneyChannel,
      createdByUserName:
        result.data.createdBy || result.data.createdByUserName || "System",
    },
  };
}

export async function deleteManualRevenue(
  revenueId: number,
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/revenues/${revenueId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete manual revenue: ${response.status}`);
  }

  return parseApiResponse<null>(response);
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
  void _locationId;
  void _periodId;
  return DEFAULT_EMPTY_BOOK_RESPONSE;
}

export async function getGLEntries(
  filters: GLEntryFilters,
): Promise<ApiResponse<GLEntryPagination>> {
  const params = new URLSearchParams();
  params.append("BusinessLocationId", String(filters.locationId));

  appendJsonArrayParam(params, "TransactionTypes", filters.transactionTypes);
  appendJsonArrayParam(params, "ReferenceTypes", filters.referenceTypes);
  appendJsonArrayParam(params, "MoneyChannels", filters.moneyChannels);

  const range = normalizeGLDateRange(filters);
  params.append("FromDate", range.fromDate);
  params.append("ToDate", range.toDate);
  params.append("ViewMode", filters.viewMode ?? DEFAULT_GL_VIEW_MODE);

  if (filters.pageNumber) {
    params.append("PageNumber", String(filters.pageNumber));
  }

  if (filters.pageSize) {
    params.append("PageSize", String(filters.pageSize));
  }

  const response = await authFetch(
    `/api/my-business/accounting/gl-entries?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch GL entries: ${response.status}`);
  }

  return parseApiResponse<GLEntryPagination>(response);
}

export async function getGLReferenceCatalog(): Promise<
  ApiResponse<GLReferenceCatalog>
> {
  const [
    referenceTypesRes,
    transactionTypesRes,
    viewModesRes,
    moneyChannelsRes,
  ] = await Promise.all([
    getStringReferenceValues("/api/reference/general-ledger-reference-types"),
    getStringReferenceValues("/api/reference/general-ledger-transaction-types"),
    getStringReferenceValues("/api/reference/general-ledger-view-modes"),
    getStringReferenceValues("/api/reference/money-channel-types"),
  ]);

  return {
    success: true,
    messageCode: "COMMON_DATA_RETRIEVED",
    message: "Data retrieved successfully",
    timestamp: new Date().toISOString(),
    data: {
      referenceTypes: referenceTypesRes.data ?? [],
      transactionTypes: transactionTypesRes.data ?? [],
      viewModes: (viewModesRes.data ?? [DEFAULT_GL_VIEW_MODE]) as GLViewMode[],
      moneyChannels: (moneyChannelsRes.data ?? []) as Array<
        "cash" | "bank" | "debt"
      >,
    },
  };
}
