import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFeatures,
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  patchPlanStatus,
} from "@/lib/admin-subscription-api";
import type {
  CreatePlanRequest,
  UpdatePlanRequest,
  PatchStatusRequest,
} from "@/lib/types/adminSubscription";

export const adminSubKeys = {
  all: ["admin-subscription-plans"] as const,
  lists: () => [...adminSubKeys.all, "list"] as const,
  detail: (id: number) => [...adminSubKeys.all, "detail", id] as const,
  features: () => ["admin-features"] as const,
};

export function useAdminFeatures() {
  return useQuery({
    queryKey: adminSubKeys.features(),
    queryFn: getFeatures,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAdminSubscriptionPlans() {
  return useQuery({
    queryKey: adminSubKeys.lists(),
    queryFn: getSubscriptionPlans,
    staleTime: 30 * 1000,
  });
}

export function useAdminSubscriptionPlan(id: number | null) {
  return useQuery({
    queryKey: adminSubKeys.detail(id ?? 0),
    queryFn: () => getSubscriptionPlan(id!),
    enabled: id != null,
    staleTime: 30 * 1000,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanRequest) => createSubscriptionPlan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubKeys.lists() });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePlanRequest }) =>
      updateSubscriptionPlan(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubKeys.lists() });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSubscriptionPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubKeys.lists() });
    },
  });
}

export function usePatchPlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: PatchStatusRequest;
    }) => patchPlanStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubKeys.lists() });
    },
  });
}
