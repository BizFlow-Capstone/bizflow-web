import { authFetch } from "@/lib/auth/tokenManager";
import type {
  ApiResponse,
  DashboardSummary,
  RevenueChartData,
  TopProductsData,
  PaymentRatioData,
  RevenueByTypeData,
  ChartPeriod,
} from "@/lib/types/dashboard";

// ---------------------------------------------------------------------------
// Backend DTO shapes (internal — not exported)
// ---------------------------------------------------------------------------

type BackendDashboardSummary = {
  businessLocationId?: number | null;
  includedLocationCount: number;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalCost: number;
  totalCompletedOrders: number;
  totalOutstandingDebt: number;
  outstandingDebtAsOfUtc: string;
};

type BackendOrderItem = {
  cashAmount: number;
  bankAmount: number;
  debtAmount: number;
  totalAmount: number;
  completedAt?: string | null;
  status: string;
};

type BackendOrderPage = {
  items: BackendOrderItem[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasNextPage: boolean;
};

type BackendProductPage = {
  items: unknown[];
  totalCount: number;
};

// ---------------------------------------------------------------------------
// Internal fetch helpers
// ---------------------------------------------------------------------------

async function fetchBackendApiJson<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T | null> {
  try {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== "" && v !== undefined && v !== null) {
        query.set(k, String(v));
      }
    }
    const url = `${path}?${query.toString()}`;
    const res = await authFetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; success?: boolean };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/** ISO date string for N days ago (or today when offset=0). */
function isoDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

/** Fetch ALL completed orders for a date range (handles pagination up to 5 pages). */
async function fetchCompletedOrders(
  locationId: number,
  fromDate: string,
  toDate: string,
  maxPages = 5,
): Promise<BackendOrderItem[]> {
  const items: BackendOrderItem[] = [];
  let page = 1;

  while (page <= maxPages) {
    const data = await fetchBackendApiJson<BackendOrderPage>("/api/orders", {
      BusinessLocationId: locationId,
      Status: "completed",
      FromDate: fromDate,
      ToDate: toDate,
      PageNumber: page,
      PageSize: 200,
    });

    if (!data) break;
    items.push(...data.items);
    if (!data.hasNextPage || data.pageNumber >= data.totalPages) break;
    page++;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function getDashboardSummary(
  locationId: number,
): Promise<ApiResponse<DashboardSummary>> {
  const today = isoDateOffset(0);

  // Run summary + low-stock-count + today's orders in parallel
  const [summaryData, productPage, todayOrders] = await Promise.all([
    fetchBackendApiJson<BackendDashboardSummary>(
      "/api/my-business/dashboard",
      locationId > 0
        ? { Period: "day", BusinessLocationId: locationId }
        : { Period: "day" },
    ),
    fetchBackendApiJson<BackendProductPage>("/api/products", {
      LocationId: locationId,
      MaxStock: 10,
      TrackInventory: "true",
      Status: "active",
      PageSize: 1,
    }),
    fetchCompletedOrders(locationId, today, today),
  ]);

  const todayCashIn = todayOrders.reduce(
    (s, o) => s + (Number(o.cashAmount) || 0),
    0,
  );
  const todayBankIn = todayOrders.reduce(
    (s, o) => s + (Number(o.bankAmount) || 0),
    0,
  );

  return {
    data: {
      date: today,
      todayRevenue: Number(summaryData?.totalRevenue ?? 0),
      todayOrders: summaryData?.totalCompletedOrders ?? 0,
      totalOutstandingDebt: Number(summaryData?.totalOutstandingDebt ?? 0),
      lowStockCount: productPage?.totalCount ?? 0,
      todayCashIn,
      todayBankIn,
      todayCashOut: 0,
      todayBankOut: 0,
    },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getRevenueChart(
  locationId: number,
  period: ChartPeriod = "7d",
): Promise<ApiResponse<RevenueChartData>> {
  const days = period === "7d" ? 7 : 30;
  const fromDate = isoDateOffset(days - 1);
  const toDate = isoDateOffset(0);

  const orders = await fetchCompletedOrders(locationId, fromDate, toDate);

  // Build a map of date → totals
  const dayMap = new Map<string, { revenue: number }>();

  // Pre-fill all days in range so chart has no gaps
  for (let i = days - 1; i >= 0; i--) {
    dayMap.set(isoDateOffset(i), { revenue: 0 });
  }

  for (const order of orders) {
    const dateKey = order.completedAt
      ? order.completedAt.split("T")[0]
      : toDate;
    if (dayMap.has(dateKey)) {
      const existing = dayMap.get(dateKey)!;
      existing.revenue += Number(order.totalAmount) || 0;
    }
  }

  const data = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue }]) => ({
      date,
      revenue,
      cost: 0,
      profit: revenue,
    }));

  return {
    data: { period, data },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getTopProducts(
  _locationId: number,
  period: ChartPeriod = "30d",
): Promise<ApiResponse<TopProductsData>> {
  // No order-item detail in the list endpoint — return empty so UI shows gracefully.
  return {
    data: { period, products: [] },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getPaymentRatio(
  locationId: number,
  period: ChartPeriod = "30d",
): Promise<ApiResponse<PaymentRatioData>> {
  const days = period === "7d" ? 7 : 30;
  const fromDate = isoDateOffset(days - 1);
  const toDate = isoDateOffset(0);

  const orders = await fetchCompletedOrders(locationId, fromDate, toDate);

  let cash = 0;
  let bank = 0;
  let debt = 0;

  for (const o of orders) {
    cash += Number(o.cashAmount) || 0;
    bank += Number(o.bankAmount) || 0;
    debt += Number(o.debtAmount) || 0;
  }

  const total = cash + bank + debt || 1; // avoid division by zero
  const pct = (v: number) => Math.round((v / total) * 1000) / 10;

  return {
    data: {
      period,
      cash: { amount: cash, percent: pct(cash) },
      bank: { amount: bank, percent: pct(bank) },
      debt: { amount: debt, percent: pct(debt) },
    },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getRevenueByType(
  _locationId: number,
  period: ChartPeriod = "30d",
): Promise<ApiResponse<RevenueByTypeData>> {
  // No per-business-type breakdown endpoint — return empty so UI shows gracefully.
  return {
    data: { period, breakdown: [] },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}
