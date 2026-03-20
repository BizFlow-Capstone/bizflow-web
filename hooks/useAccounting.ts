import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCosts,
  getRevenues,
  getCashFlowReport,
  getAccountingPeriods,
  createAccountingPeriod,
  createCustomPeriod,
  getOpeningBalanceSuggestion,
  finalizePeriod,
  reopenPeriod,
  getPeriodAuditLogs,
  getAccountingTemplates,
  getAccountingBooks,
} from "@/services/accountingService";
import type {
  CostFilters,
  CreatePeriodRequest,
  CreateCustomPeriodRequest,
  OpeningBalanceSuggestionRequest,
} from "@/lib/types/accounting";

export const accountingKeys = {
  all: ["accounting"] as const,
  costs: (filters: CostFilters) =>
    [...accountingKeys.all, "costs", filters] as const,
  revenues: (locationId: number) =>
    [...accountingKeys.all, "revenues", locationId] as const,
  cashFlow: (locationId: number, start: string, end: string) =>
    [...accountingKeys.all, "cashflow", locationId, start, end] as const,
  periods: (locationId: number) =>
    [...accountingKeys.all, "periods", locationId] as const,
  auditLogs: (locationId: number, periodId: number) =>
    [...accountingKeys.all, "audit-logs", locationId, periodId] as const,
  templates: () => [...accountingKeys.all, "templates"] as const,
  books: (locationId: number, periodId?: number) =>
    [...accountingKeys.all, "books", locationId, periodId] as const,
};

export function useCosts(filters: CostFilters) {
  return useQuery({
    queryKey: accountingKeys.costs(filters),
    queryFn: async () => {
      const result = await getCosts(filters);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: filters.locationId > 0,
  });
}

export function useRevenues(locationId: number) {
  return useQuery({
    queryKey: accountingKeys.revenues(locationId),
    queryFn: async () => {
      const result = await getRevenues(locationId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function useCashFlowReport(
  locationId: number,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: accountingKeys.cashFlow(locationId, startDate, endDate),
    queryFn: async () => {
      const result = await getCashFlowReport(locationId, startDate, endDate);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0 && !!startDate && !!endDate,
  });
}

export function useAccountingPeriods(locationId: number) {
  return useQuery({
    queryKey: accountingKeys.periods(locationId),
    queryFn: async () => {
      const result = await getAccountingPeriods(locationId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function useCreatePeriod(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePeriodRequest) =>
      createAccountingPeriod(locationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountingKeys.periods(locationId),
      });
    },
  });
}

export function useFinalizePeriod(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => finalizePeriod(locationId, periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountingKeys.periods(locationId),
      });
    },
  });
}

export function useReopenPeriod(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodId, reason }: { periodId: number; reason: string }) =>
      reopenPeriod(locationId, periodId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountingKeys.periods(locationId),
      });
    },
  });
}

export function usePeriodAuditLogs(locationId: number, periodId: number) {
  return useQuery({
    queryKey: accountingKeys.auditLogs(locationId, periodId),
    queryFn: async () => {
      const result = await getPeriodAuditLogs(locationId, periodId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0 && periodId > 0,
  });
}

export function useAccountingTemplates() {
  return useQuery({
    queryKey: accountingKeys.templates(),
    queryFn: async () => {
      const result = await getAccountingTemplates();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useAccountingBooks(locationId: number, periodId?: number) {
  return useQuery({
    queryKey: accountingKeys.books(locationId, periodId),
    queryFn: async () => {
      const result = await getAccountingBooks(locationId, periodId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0,
  });
}

export function useCreateCustomPeriod(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomPeriodRequest) =>
      createCustomPeriod(locationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountingKeys.periods(locationId),
      });
    },
  });
}

export function useOpeningBalanceSuggestion(locationId: number) {
  return useMutation({
    mutationFn: (params: OpeningBalanceSuggestionRequest) =>
      getOpeningBalanceSuggestion(locationId, params),
  });
}
