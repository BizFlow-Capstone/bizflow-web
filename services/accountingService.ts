import { authFetch } from "@/lib/auth/tokenManager";
import type {
  ApiResponse,
  AccountingBookSections,
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
  GLEntryListItem,
  GLEntryFilters,
  GLReferenceCatalog,
  GLViewMode,
  RevenueFilters,
  CreateManualRevenueRequest,
  RevenueRecord,
  RevenueForecastResponse,
} from "@/lib/types/accounting";

const DEFAULT_EMPTY_REVENUE: RevenuePagination = {
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 0,
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

function appendArrayQueryParam(
  params: URLSearchParams,
  key: string,
  values?: string[],
) {
  if (!values || values.length === 0) return;
  values.forEach((value) => {
    if (!value) return;
    params.append(key, value);
  });
}

// Extracts the string code from a BE ReferenceOptionDto { code, label } or returns the value as-is.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRefCode(val: any): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "object") return String(val.code);
  return String(val);
}

function normalizePeriod(p: AccountingPeriod): AccountingPeriod {
  return {
    ...p,
    periodType: (extractRefCode(p.periodType) ??
      p.periodType) as AccountingPeriod["periodType"],
    status: (extractRefCode(p.status) ??
      p.status) as AccountingPeriod["status"],
  };
}

async function parseNormalizedPeriod(
  response: Response,
): Promise<ApiResponse<AccountingPeriod>> {
  const result = await parseApiResponse<AccountingPeriod>(response);
  return {
    ...result,
    data: result.data ? normalizePeriod(result.data) : result.data,
  };
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

  const result = await parseApiResponse<CostPagination>(response);
  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          items: (result.data.items ?? []).map((item) => ({
            ...item,
            costType: (extractRefCode(item.costType) ??
              item.costType) as CostRecord["costType"],
            paymentMethod: extractRefCode(
              item.paymentMethod,
            ) as CostRecord["paymentMethod"],
          })),
        }
      : result.data,
  };
}

export async function getAllCosts(
  filters: CostFilters,
): Promise<ApiResponse<CostPagination>> {
  const pageSize = 100;
  const first = await getCosts({ ...filters, pageNumber: 1, pageSize });

  const firstData = first.data;
  const totalPages = Math.max(firstData.totalPages ?? 1, 1);
  const allItems: CostRecord[] = [...(firstData.items ?? [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await getCosts({ ...filters, pageNumber: page, pageSize });
    allItems.push(...(next.data.items ?? []));
  }

  return {
    ...first,
    data: {
      ...firstData,
      items: allItems,
      totalCount: firstData.totalCount ?? allItems.length,
      pageNumber: 1,
      pageSize: allItems.length || pageSize,
      totalPages: 1,
    },
  };
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

export async function getRevenueForecast(
  locationId: number,
): Promise<ApiResponse<RevenueForecastResponse>> {
  const params = new URLSearchParams();
  params.append("locationId", String(locationId));

  const response = await authFetch(
    `/api/my-business/ai/forecast?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch revenue forecast: ${response.status}`);
  }

  return parseApiResponse<RevenueForecastResponse>(response);
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
        revenueType: (extractRefCode(item.revenueType) ??
          item.revenueType) as RevenueRecord["revenueType"],
        moneyChannel: extractRefCode(
          item.moneyChannel,
        ) as RevenueRecord["moneyChannel"],
        paymentMethod: extractRefCode(
          item.moneyChannel,
        ) as RevenueRecord["moneyChannel"],
        createdByUserName: item.createdBy || item.createdByUserName || "System",
      })) as RevenueRecord[],
    },
  };
}

export async function getAllRevenuesWithFilters(
  filters: RevenueFilters,
): Promise<ApiResponse<RevenuePagination>> {
  const pageSize = 100;
  const first = await getRevenuesWithFilters({
    ...filters,
    pageNumber: 1,
    pageSize,
  });

  const firstData = first.data;
  const totalPages = Math.max(firstData.totalPages ?? 1, 1);
  const allItems: RevenueRecord[] = [...(firstData.items ?? [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await getRevenuesWithFilters({
      ...filters,
      pageNumber: page,
      pageSize,
    });
    allItems.push(...(next.data.items ?? []));
  }

  return {
    ...first,
    data: {
      ...firstData,
      items: allItems,
      totalCount: firstData.totalCount ?? allItems.length,
      pageNumber: 1,
      pageSize: allItems.length || pageSize,
      totalPages: 1,
    },
  };
}

export async function createManualRevenue(
  data: CreateManualRevenueRequest,
): Promise<ApiResponse<RevenueRecord>> {
  const formData = new FormData();
  formData.append("BusinessLocationId", String(data.businessLocationId));
  formData.append("BusinessTypeId", data.businessTypeId);
  formData.append("Amount", String(data.amount));
  formData.append("RevenueDate", data.revenueDate);
  formData.append("Description", data.description);
  formData.append("MoneyChannel", data.moneyChannel);

  const response = await authFetch(`/api/revenues/manual`, {
    method: "POST",
    body: formData,
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
    getAllCosts({ locationId, fromDate: startDate, toDate: endDate }),
    getAllRevenuesWithFilters({
      locationId,
      fromDate: startDate,
      toDate: endDate,
    }),
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
    const channel = revenue.moneyChannel ?? revenue.paymentMethod;
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

  const result = await parseApiResponse<AccountingPeriod[]>(response);
  return {
    ...result,
    data: (result.data ?? []).map((p) => ({
      ...p,
      periodType: (extractRefCode(p.periodType) ??
        p.periodType) as AccountingPeriod["periodType"],
      status: (extractRefCode(p.status) ??
        p.status) as AccountingPeriod["status"],
    })),
  };
}

export async function getAccountingPeriodDetail(
  locationId: number,
  periodId: number,
): Promise<ApiResponse<AccountingPeriod>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/${periodId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch accounting period detail: ${response.status}`,
    );
  }

  const result = await parseApiResponse<AccountingPeriod>(response);
  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          periodType: (extractRefCode(result.data.periodType) ??
            result.data.periodType) as AccountingPeriod["periodType"],
          status: (extractRefCode(result.data.status) ??
            result.data.status) as AccountingPeriod["status"],
        }
      : result.data,
  };
}

export async function deleteAccountingPeriod(
  locationId: number,
  periodId: number,
): Promise<ApiResponse<unknown>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/periods/${periodId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete accounting period: ${response.status}`);
  }

  return parseApiResponse<unknown>(response);
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

  return parseNormalizedPeriod(response);
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

  return parseNormalizedPeriod(response);
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

  return parseNormalizedPeriod(response);
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

  return parseNormalizedPeriod(response);
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
      action: (extractRefCode(log.action) ??
        log.action) as PeriodAuditLog["action"],
      createdByUserName:
        log.createdByUserName || log.createdByUserId || "Unknown user",
    })),
  };
}

export async function getAccountingTemplates(): Promise<
  ApiResponse<AccountingTemplate[]>
> {
  const hardcodedTemplates: AccountingTemplate[] = [
    {
      templateId: 1,
      templateCode: "S1a",
      name: "Sổ chi tiết bán hàng hóa, dịch vụ — TT152",
      applicableGroups: [1],
      isActive: true,
    },
    {
      templateId: 2,
      templateCode: "S2a",
      name: "Sổ doanh thu bán hàng hóa, dịch vụ (Cách 1) — TT152",
      applicableGroups: [2],
      applicableMethods: ["method_1"],
      isActive: true,
    },
    {
      templateId: 3,
      templateCode: "S2b",
      name: "Sổ doanh thu bán hàng hóa, dịch vụ (Cách 2) — TT152",
      applicableGroups: [2, 3, 4],
      applicableMethods: ["method_2"],
      isActive: true,
    },
    {
      templateId: 4,
      templateCode: "S2c",
      name: "Sổ chi tiết doanh thu, chi phí — TT152",
      applicableGroups: [2, 3, 4],
      applicableMethods: ["method_2"],
      isActive: true,
    },
    {
      templateId: 5,
      templateCode: "S2d",
      name: "Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa — TT152",
      applicableGroups: [2, 3, 4],
      applicableMethods: ["method_2"],
      isActive: true,
    },
    {
      templateId: 6,
      templateCode: "S2e",
      name: "Sổ chi tiết tiền — TT152",
      applicableGroups: [2, 3, 4],
      applicableMethods: ["method_2"],
      isActive: true,
    },
  ];

  return {
    success: true,
    data: hardcodedTemplates,
    messageCode: "COMMON_DATA_RETRIEVED",
    message: "Templates retrieved",
    timestamp: new Date().toISOString(),
  };
}

export async function getAccountingBooks(
  locationId: number,
  periodId?: number,
): Promise<ApiResponse<AccountingBook[]>> {
  const params = new URLSearchParams();
  if (periodId) params.append("periodId", String(periodId));
  const url = `/api/locations/${locationId}/accounting/books${params.toString() ? "?" + params.toString() : ""}`;
  const response = await authFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not fetch accounting books");
  return parseApiResponse<AccountingBook[]>(response);
}

export async function getGLEntries(
  filters: GLEntryFilters,
): Promise<ApiResponse<GLEntryPagination>> {
  const params = new URLSearchParams();
  params.append("BusinessLocationId", String(filters.locationId));

  appendArrayQueryParam(params, "TransactionTypes", filters.transactionTypes);
  appendArrayQueryParam(params, "ReferenceTypes", filters.referenceTypes);
  appendArrayQueryParam(params, "MoneyChannels", filters.moneyChannels);

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

  const result = await parseApiResponse<GLEntryPagination>(response);
  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          items: (result.data.items ?? []).map((entry) => ({
            ...entry,
            transactionType: (extractRefCode(entry.transactionType) ??
              entry.transactionType) as string,
            moneyChannel: extractRefCode(
              entry.moneyChannel,
            ) as GLEntryListItem["moneyChannel"],
            effectiveStatus: extractRefCode(
              entry.effectiveStatus,
            ) as GLEntryListItem["effectiveStatus"],
            source: entry.source
              ? {
                  ...entry.source,
                  referenceType: (extractRefCode(entry.source.referenceType) ??
                    entry.source.referenceType) as string,
                }
              : entry.source,
          })),
        }
      : result.data,
  };
}

export async function getAllGLEntries(
  filters: GLEntryFilters,
): Promise<ApiResponse<GLEntryPagination>> {
  const pageSize = 200;
  const first = await getGLEntries({
    ...filters,
    pageNumber: 1,
    pageSize,
  });

  const firstData = first.data;
  const totalPages = Math.max(firstData.totalPages ?? 1, 1);
  const allItems: GLEntryListItem[] = [...(firstData.items ?? [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await getGLEntries({
      ...filters,
      pageNumber: page,
      pageSize,
    });
    allItems.push(...(next.data.items ?? []));
  }

  return {
    ...first,
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

// Get book summary (KPI, formulas, etc.)
export async function getBookSummary(locationId: number, bookId: number) {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/books/${bookId}/summary`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Không thể tải summary sổ kế toán");
  return (await response.json()) as ApiResponse<Record<string, unknown>>;
}

export async function getBookRows(
  locationId: number,
  bookId: number,
  batchSize = 200,
  cursor?: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  const params = new URLSearchParams();
  params.append("batchSize", String(batchSize));
  if (cursor) params.append("cursor", cursor);

  const response = await authFetch(
    `/api/locations/${locationId}/accounting/books/${bookId}/rows?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) throw new Error("Không thể tải dòng sổ kế toán");
  return (await response.json()) as ApiResponse<Record<string, unknown>>;
}

export async function getBookSections(
  locationId: number,
  bookId: number,
): Promise<ApiResponse<AccountingBookSections>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/books/${bookId}/sections`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) throw new Error("Không thể tải cấu trúc sổ kế toán");
  return parseApiResponse<AccountingBookSections>(response);
}

export async function deleteAccountingBook(
  locationId: number,
  bookId: number,
): Promise<ApiResponse<unknown>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/books/${bookId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error("Không thể xóa sổ kế toán");
  }

  return parseApiResponse<unknown>(response);
}
