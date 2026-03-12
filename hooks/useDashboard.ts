import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getRevenueChart,
  getTopProducts,
  getPaymentRatio,
  getRevenueByType,
} from "@/services/dashboardService";
import type { ChartPeriod } from "@/lib/types/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (locationId: number) =>
    [...dashboardKeys.all, "summary", locationId] as const,
  revenueChart: (locationId: number, period: ChartPeriod) =>
    [...dashboardKeys.all, "revenue-chart", locationId, period] as const,
  topProducts: (locationId: number, period: ChartPeriod) =>
    [...dashboardKeys.all, "top-products", locationId, period] as const,
  paymentRatio: (locationId: number, period: ChartPeriod) =>
    [...dashboardKeys.all, "payment-ratio", locationId, period] as const,
  revenueByType: (locationId: number, period: ChartPeriod) =>
    [...dashboardKeys.all, "revenue-by-type", locationId, period] as const,
};

export function useDashboardSummary(locationId: number) {
  return useQuery({
    queryKey: dashboardKeys.summary(locationId),
    queryFn: async () => {
      const result = await getDashboardSummary(locationId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function useRevenueChart(locationId: number, period: ChartPeriod) {
  return useQuery({
    queryKey: dashboardKeys.revenueChart(locationId, period),
    queryFn: async () => {
      const result = await getRevenueChart(locationId, period);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function useTopProducts(locationId: number, period: ChartPeriod) {
  return useQuery({
    queryKey: dashboardKeys.topProducts(locationId, period),
    queryFn: async () => {
      const result = await getTopProducts(locationId, period);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function usePaymentRatio(locationId: number, period: ChartPeriod) {
  return useQuery({
    queryKey: dashboardKeys.paymentRatio(locationId, period),
    queryFn: async () => {
      const result = await getPaymentRatio(locationId, period);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function useRevenueByType(locationId: number, period: ChartPeriod) {
  return useQuery({
    queryKey: dashboardKeys.revenueByType(locationId, period),
    queryFn: async () => {
      const result = await getRevenueByType(locationId, period);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}
