// Types for Dashboard API

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// --- Summary (Tầng 1 — Quick Glance) ---

export interface DashboardSummary {
  businessLocationId?: number | null;
  includedLocationCount: number;
  period: SummaryPeriod;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalCost: number;
  totalCompletedOrders: number;
  outstandingDebtNetChangeInPeriod: number;
}

export type SummaryPeriod = "day" | "month" | "year";

// --- Revenue Chart ---

export type ChartPeriod = "7d" | "30d";

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface RevenueChartData {
  period: ChartPeriod;
  data: RevenueDataPoint[];
}

// --- Top Products ---

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface TopProductsData {
  period: ChartPeriod;
  products: TopProduct[];
}

// --- Payment Ratio ---

export interface PaymentRatioItem {
  amount: number;
  percent: number;
}

export interface PaymentRatioData {
  period: ChartPeriod;
  cash: PaymentRatioItem;
  bank: PaymentRatioItem;
  debt: PaymentRatioItem;
}

// --- Revenue by Business Type ---

export interface RevenueByTypeItem {
  businessTypeId: string;
  name: string;
  revenue: number;
  percent: number;
}

export interface RevenueByTypeData {
  period: ChartPeriod;
  breakdown: RevenueByTypeItem[];
}
