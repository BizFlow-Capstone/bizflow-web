import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCosts,
  createManualCost,
  updateManualCost,
  deleteManualCost,
  getCostReferenceCatalog,
  getRevenues,
  getRevenuesWithFilters,
  createManualRevenue,
  deleteManualRevenue,
  getCashFlowReport,
  getAccountingPeriods,
  getAccountingPeriodDetail,
  deleteAccountingPeriod,
  createAccountingPeriod,
  createCustomPeriod,
  getOpeningBalanceSuggestion,
  finalizePeriod,
  reopenPeriod,
  getPeriodAuditLogs,
  getAccountingTemplates,
  getAccountingBooks,
  getGLEntries,
  getGLReferenceCatalog,
  deleteAccountingBook,
} from "@/services/accountingService";
import type {
  CostFilters,
  CreateManualCostRequest,
  UpdateManualCostRequest,
  RevenueFilters,
  CreateManualRevenueRequest,
  CreatePeriodRequest,
  CreateCustomPeriodRequest,
  OpeningBalanceSuggestionRequest,
  GLEntryFilters,
} from "@/lib/types/accounting";
import {
  createAccountingBook,
  CreateAccountingBookRequest,
} from "@/services/createAccountingBookService";

export const accountingKeys = {
  all: ["accounting"] as const,
  costs: (filters: CostFilters) =>
    [...accountingKeys.all, "costs", filters] as const,
  revenues: (locationId: number) =>
    [...accountingKeys.all, "revenues", locationId] as const,
  revenuesByFilters: (filters: RevenueFilters) =>
    [...accountingKeys.all, "revenues", filters] as const,
  cashFlow: (locationId: number, start: string, end: string) =>
    [...accountingKeys.all, "cashflow", locationId, start, end] as const,
  periods: (locationId: number) =>
    [...accountingKeys.all, "periods", locationId] as const,
  periodDetail: (locationId: number, periodId?: number) =>
    [...accountingKeys.all, "period-detail", locationId, periodId] as const,
  auditLogs: (locationId: number, periodId: number) =>
    [...accountingKeys.all, "audit-logs", locationId, periodId] as const,
  templates: () => [...accountingKeys.all, "templates"] as const,
  books: (locationId: number, periodId?: number) =>
    [...accountingKeys.all, "books", locationId, periodId] as const,
  glEntries: (filters: GLEntryFilters) =>
    [...accountingKeys.all, "gl-entries", filters] as const,
  glReferences: () => [...accountingKeys.all, "gl-reference-catalog"] as const,
  costReferences: () =>
    [...accountingKeys.all, "cost-reference-catalog"] as const,
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

export function useCreateManualCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateManualCostRequest) => createManualCost(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.costs({
          locationId: variables.businessLocationId,
        }),
      });
    },
  });
}

export function useUpdateManualCost(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      costId,
      data,
    }: {
      costId: number;
      data: UpdateManualCostRequest;
    }) => updateManualCost(costId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.costs({ locationId }),
      });
    },
  });
}

export function useDeleteManualCost(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (costId: number) => deleteManualCost(costId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.costs({ locationId }),
      });
    },
  });
}

export function useCostReferenceCatalog() {
  return useQuery({
    queryKey: accountingKeys.costReferences(),
    queryFn: async () => {
      const result = await getCostReferenceCatalog();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useRevenuesByFilters(filters: RevenueFilters) {
  return useQuery({
    queryKey: accountingKeys.revenuesByFilters(filters),
    queryFn: async () => {
      const result = await getRevenuesWithFilters(filters);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: filters.locationId > 0,
  });
}

export function useCreateManualRevenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateManualRevenueRequest) => createManualRevenue(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.revenues(variables.businessLocationId),
      });
    },
  });
}

export function useDeleteManualRevenue(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revenueId: number) => deleteManualRevenue(revenueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.revenues(locationId),
      });
    },
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

export function useAccountingPeriodDetail(
  locationId: number,
  periodId?: number,
) {
  return useQuery({
    queryKey: accountingKeys.periodDetail(locationId, periodId),
    queryFn: async () => {
      const result = await getAccountingPeriodDetail(
        locationId,
        periodId as number,
      );
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: locationId > 0 && !!periodId,
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

export function useDeletePeriod(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) =>
      deleteAccountingPeriod(locationId, periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountingKeys.periods(locationId),
      });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.books(locationId),
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
    enabled: locationId > 0 && !!periodId,
  });
}

export function useGLEntries(filters: GLEntryFilters) {
  return useQuery({
    queryKey: accountingKeys.glEntries(filters),
    queryFn: async () => {
      const result = await getGLEntries(filters);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: filters.locationId > 0,
  });
}

export function useGLReferenceCatalog() {
  return useQuery({
    queryKey: accountingKeys.glReferences(),
    queryFn: async () => {
      const result = await getGLReferenceCatalog();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
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

export function useCreateAccountingBook(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountingBookRequest) =>
      createAccountingBook(locationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountingKeys.books(locationId),
      });
    },
  });
}

export function useDeleteAccountingBook(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookId: number) => deleteAccountingBook(locationId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountingKeys.books(locationId),
      });
    },
  });
}
