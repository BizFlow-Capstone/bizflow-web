import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getDebtors,
  getDebtorDetail,
  createDebtor,
  updateDebtor,
  deleteDebtor,
  recordPayment,
  getDebtSummary,
} from "@/services/debtorService";
import type {
  DebtorFilters,
  DebtorPagination,
  DebtorFull,
  CreateDebtorRequest,
  UpdateDebtorRequest,
  RecordPaymentRequest,
  DebtSummary,
} from "@/lib/types/debtor";

export const debtorKeys = {
  all: ["debtors"] as const,
  lists: () => [...debtorKeys.all, "list"] as const,
  list: (filters: DebtorFilters) => [...debtorKeys.lists(), filters] as const,
  details: () => [...debtorKeys.all, "detail"] as const,
  detail: (id: number) => [...debtorKeys.details(), id] as const,
  summary: () => [...debtorKeys.all, "summary"] as const,
};

export function useDebtors(filters: DebtorFilters) {
  return useQuery<DebtorPagination>({
    queryKey: debtorKeys.list(filters),
    queryFn: async () => {
      const response = await getDebtors(filters);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useDebtorDetail(debtorId: number) {
  return useQuery<DebtorFull>({
    queryKey: debtorKeys.detail(debtorId),
    queryFn: async () => {
      const response = await getDebtorDetail(debtorId);
      return response.data;
    },
    enabled: !!debtorId,
  });
}

export function useDebtSummary() {
  return useQuery<DebtSummary>({
    queryKey: debtorKeys.summary(),
    queryFn: async () => {
      const response = await getDebtSummary();
      return response.data;
    },
  });
}

export function useCreateDebtor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDebtorRequest) => createDebtor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: debtorKeys.summary() });
    },
  });
}

export function useUpdateDebtor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      debtorId,
      data,
    }: {
      debtorId: number;
      data: UpdateDebtorRequest;
    }) => updateDebtor(debtorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtorKeys.all });
    },
  });
}

export function useDeleteDebtor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (debtorId: number) => deleteDebtor(debtorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: debtorKeys.summary() });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      debtorId,
      data,
    }: {
      debtorId: number;
      data: RecordPaymentRequest;
    }) => recordPayment(debtorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtorKeys.all });
    },
  });
}
