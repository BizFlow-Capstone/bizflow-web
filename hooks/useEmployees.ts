import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvitation,
  getEmployees,
  getPendingInvitations,
  inviteEmployee,
  rejectInvitation,
  removeEmployee,
  searchEmployees,
} from "@/services/employeeService";

/**
 * Query key factory for employees
 */
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  search: (query: string) => [...employeeKeys.all, "search", query] as const,
  invitations: () => [...employeeKeys.all, "invitations"] as const,
};

/**
 * Hook to fetch employees for dropdown selection
 */
export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: async () => {
      const response = await getEmployees();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - employees don't change often
  });
}

export function useEmployeeSearch(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: employeeKeys.search(normalizedQuery),
    queryFn: async () => {
      const response = await searchEmployees(normalizedQuery);
      return response.data;
    },
    enabled: normalizedQuery.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: employeeKeys.invitations(),
    queryFn: async () => {
      const response = await getPendingInvitations();
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useInviteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => inviteEmployee({ employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.invitations() });
    },
  });
}

export function useRemoveEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => removeEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hireId: number) => acceptInvitation(hireId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.invitations() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hireId: number) => rejectInvitation(hireId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.invitations() });
    },
  });
}
