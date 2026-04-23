/**
 * Import Hooks
 * TanStack Query hooks for import data fetching and mutations
 * Handles caching, invalidation, and loading states
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getImports,
  getAllImports,
  getImportDetail,
  createImport,
  updateImport,
  confirmImport,
  deleteImport,
  getImportTemplate,
} from "@/services/importService";
import type {
  ImportFilters,
  ImportPagination,
  ImportDetail,
  CreateImportRequest,
  UpdateImportRequest,
  ConfirmImportRequest,
} from "@/lib/types/import";

/**
 * Query key factory for imports
 */
export const importKeys = {
  all: ["imports"] as const,
  lists: () => [...importKeys.all, "list"] as const,
  list: (filters: ImportFilters) => [...importKeys.lists(), filters] as const,
  allPages: () => [...importKeys.all, "all-pages"] as const,
  allPagesList: (filters: ImportFilters) =>
    [...importKeys.allPages(), filters] as const,
  details: () => [...importKeys.all, "detail"] as const,
  detail: (id: number) => [...importKeys.details(), id] as const,
  template: () => [...importKeys.all, "template"] as const,
};

/**
 * Hook to fetch imports with filters and pagination
 * Uses keepPreviousData for smooth pagination transitions
 */
export function useImports(filters: ImportFilters, enabled = true) {
  return useQuery<ImportPagination>({
    queryKey: importKeys.list(filters),
    queryFn: async () => {
      const response = await getImports(filters);
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAllImports(filters: ImportFilters, enabled = true) {
  return useQuery<ImportPagination>({
    queryKey: importKeys.allPagesList(filters),
    queryFn: async () => {
      const response = await getAllImports(filters);
      return response.data;
    },
    enabled,
  });
}

/**
 * Hook to fetch import detail by ID
 */
export function useImportDetail(importId: number) {
  return useQuery<ImportDetail>({
    queryKey: importKeys.detail(importId),
    queryFn: async () => {
      const response = await getImportDetail(importId);
      return response.data;
    },
    enabled: !!importId,
  });
}

/**
 * Hook to create a new import
 * Invalidates import list queries on success
 */
export function useCreateImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateImportRequest) => createImport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      queryClient.invalidateQueries({ queryKey: importKeys.allPages() });
    },
  });
}

/**
 * Hook to update a DRAFT import
 * Invalidates both list and detail queries on success
 */
export function useUpdateImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      importId,
      data,
    }: {
      importId: number;
      data: UpdateImportRequest;
    }) => updateImport(importId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      queryClient.invalidateQueries({ queryKey: importKeys.allPages() });
      queryClient.invalidateQueries({
        queryKey: importKeys.detail(variables.importId),
      });
    },
  });
}

/**
 * Hook to confirm a DRAFT import
 * Invalidates both list and detail queries on success
 */
export function useConfirmImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      importId,
      data,
    }: {
      importId: number;
      data: ConfirmImportRequest;
    }) => confirmImport(importId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      queryClient.invalidateQueries({ queryKey: importKeys.allPages() });
      queryClient.invalidateQueries({
        queryKey: importKeys.detail(variables.importId),
      });
    },
  });
}

/**
 * Hook to delete/cancel an import
 * Invalidates import list queries on success
 */
export function useDeleteImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importId: number) => deleteImport(importId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      queryClient.invalidateQueries({ queryKey: importKeys.allPages() });
    },
  });
}

/**
 * Hook to fetch import template schema
 */
export function useImportTemplate() {
  return useQuery({
    queryKey: importKeys.template(),
    queryFn: async () => {
      const response = await getImportTemplate();
      return response.data;
    },
  });
}
