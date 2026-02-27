import { useQuery } from "@tanstack/react-query";
import { getBusinessTypes } from "@/services/businessTypeService";
import type { BusinessType } from "@/lib/types/businessType";

/**
 * Query key factory for business types
 */
export const businessTypeKeys = {
  all: ["businessTypes"] as const,
};

/**
 * Hook to fetch all business types
 * Data is relatively static, so we use a long staleTime
 */
export function useBusinessTypes() {
  return useQuery<BusinessType[]>({
    queryKey: businessTypeKeys.all,
    queryFn: async () => {
      const response = await getBusinessTypes();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - business types rarely change
  });
}
