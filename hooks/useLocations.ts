/**
 * Location Hooks
 * TanStack Query hooks for location data fetching and mutations
 * Handles caching, invalidation, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLocations,
  createLocation,
  updateLocationStatus,
  updateLocation,
  deleteLocation,
  getLocationEmployees,
  assignLocationEmployees,
} from "@/services/locationService";
import type {
  Location,
  NewLocationForm,
  UpdateLocationPayload,
} from "@/lib/types/location";

// Query keys for cache management
export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...locationKeys.lists(), filters] as const,
  details: () => [...locationKeys.all, "detail"] as const,
  detail: (id: number) => [...locationKeys.details(), id] as const,
  employees: (id: number) => [...locationKeys.all, "employees", id] as const,
};

/**
 * Hook to fetch all locations
 * Data is automatically cached and refetched when stale
 */
export function useLocations() {
  return useQuery({
    queryKey: locationKeys.lists(),
    queryFn: async () => {
      const result = await getLocations();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });
}

/**
 * Hook to fetch a single location by ID
 * Reuses the locations list cache to avoid extra API calls
 */
export function useLocationDetail(id: number) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: async () => {
      const result = await getLocations();
      if (!result.success) {
        throw new Error(result.message);
      }
      const location = result.data.find((loc) => loc.id === id);
      if (!location) {
        throw new Error("Location not found");
      }
      return location;
    },
  });
}

/**
 * Hook to fetch employees for a specific location
 * Only fetches when enabled (dialog is open)
 */
export function useLocationEmployees(locationId: number, enabled = false) {
  return useQuery({
    queryKey: locationKeys.employees(locationId),
    queryFn: async () => {
      const result = await getLocationEmployees(locationId);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data.employees;
    },
    enabled,
  });
}

/**
 * Hook to create a new location
 * Automatically invalidates the locations list cache after success
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewLocationForm) => createLocation(data),
    onSuccess: () => {
      // Invalidate and refetch locations list
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

/**
 * Hook to update location status
 * Uses optimistic updates for instant UI feedback
 */
export function useUpdateLocationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      updateLocationStatus(id, isActive),

    // Optimistic update
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: locationKeys.lists() });

      // Snapshot the previous value
      const previousLocations = queryClient.getQueryData<Location[]>(
        locationKeys.lists(),
      );

      // Optimistically update to the new value
      if (previousLocations) {
        queryClient.setQueryData<Location[]>(
          locationKeys.lists(),
          previousLocations.map((loc) =>
            loc.id === id ? { ...loc, isActive } : loc,
          ),
        );
      }

      // Return context with the previous value
      return { previousLocations };
    },

    // On error, roll back to the previous value
    onError: (_err, _variables, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(
          locationKeys.lists(),
          context.previousLocations,
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

/**
 * Hook to update location details
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLocationPayload }) =>
      updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

/**
 * Hook to delete a location
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

/**
 * Hook to assign employees for a location
 */
export function useAssignLocationEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      employeeIds,
    }: {
      locationId: number;
      employeeIds: string[];
    }) => assignLocationEmployees(locationId, employeeIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: locationKeys.employees(variables.locationId),
      });
    },
  });
}
