import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getAdminUsers,
  revokeAdminUserRefreshTokens,
} from "@/lib/admin-users-api";
import type { AdminUserQueryParams } from "@/lib/types/adminUserManagement";

export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (query: AdminUserQueryParams) =>
    [...adminUserKeys.lists(), query] as const,
};

export function useAdminUsers(query: AdminUserQueryParams) {
  return useQuery({
    queryKey: adminUserKeys.list(query),
    queryFn: () => getAdminUsers(query),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useRevokeAdminUserRefreshTokens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => revokeAdminUserRefreshTokens(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}
