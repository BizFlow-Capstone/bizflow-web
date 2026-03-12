import type {
  ApiResponse,
  DashboardSummary,
  RevenueChartData,
  TopProductsData,
  PaymentRatioData,
  RevenueByTypeData,
  ChartPeriod,
} from "@/lib/types/dashboard";

/**
 * Dashboard Service
 * Mock data — will be replaced by real API calls when backend is ready
 */

// --- Mock data generators ---

function generateRevenueChart(period: ChartPeriod): RevenueChartData {
  const days = period === "7d" ? 7 : 30;
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const revenue = Math.floor(Math.random() * 15000000) + 8000000;
    const cost = Math.floor(revenue * (0.25 + Math.random() * 0.2));
    data.push({
      date: date.toISOString().split("T")[0],
      revenue,
      cost,
      profit: revenue - cost,
    });
  }

  return { period, data };
}

const MOCK_SUMMARY: DashboardSummary = {
  date: new Date().toISOString().split("T")[0],
  todayRevenue: 12500000,
  todayOrders: 8,
  totalOutstandingDebt: 15000000,
  lowStockCount: 5,
  todayCashIn: 8000000,
  todayBankIn: 3500000,
  todayCashOut: 2000000,
  todayBankOut: 0,
};

const MOCK_TOP_PRODUCTS: TopProductsData = {
  period: "30d",
  products: [
    {
      productId: 10,
      productName: "Xi măng Hà Tiên",
      totalQuantity: 500,
      totalRevenue: 47500000,
    },
    {
      productId: 22,
      productName: "Sắt phi 12",
      totalQuantity: 200,
      totalRevenue: 24000000,
    },
    {
      productId: 5,
      productName: "Cát xây dựng",
      totalQuantity: 1500,
      totalRevenue: 18000000,
    },
    {
      productId: 31,
      productName: "Gạch ống",
      totalQuantity: 3000,
      totalRevenue: 15000000,
    },
    {
      productId: 8,
      productName: "Tôn lợp mái",
      totalQuantity: 80,
      totalRevenue: 12000000,
    },
  ],
};

const MOCK_PAYMENT_RATIO: PaymentRatioData = {
  period: "30d",
  cash: { amount: 350000000, percent: 56.5 },
  bank: { amount: 180000000, percent: 29.0 },
  debt: { amount: 90000000, percent: 14.5 },
};

const MOCK_REVENUE_BY_TYPE: RevenueByTypeData = {
  period: "30d",
  breakdown: [
    {
      businessTypeId: "bt-retail",
      name: "Bán lẻ hàng hóa",
      revenue: 500000000,
      percent: 80.6,
    },
    {
      businessTypeId: "bt-service",
      name: "Dịch vụ",
      revenue: 120000000,
      percent: 19.4,
    },
  ],
};

// --- Service functions ---

export async function getDashboardSummary(
  _locationId: number,
): Promise<ApiResponse<DashboardSummary>> {
  await new Promise((r) => setTimeout(r, 300));
  return {
    data: MOCK_SUMMARY,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getRevenueChart(
  _locationId: number,
  period: ChartPeriod = "7d",
): Promise<ApiResponse<RevenueChartData>> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    data: generateRevenueChart(period),
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
  await new Promise((r) => setTimeout(r, 300));
  return {
    data: { ...MOCK_TOP_PRODUCTS, period },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getPaymentRatio(
  _locationId: number,
  period: ChartPeriod = "30d",
): Promise<ApiResponse<PaymentRatioData>> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    data: { ...MOCK_PAYMENT_RATIO, period },
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
  await new Promise((r) => setTimeout(r, 250));
  return {
    data: { ...MOCK_REVENUE_BY_TYPE, period },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}
