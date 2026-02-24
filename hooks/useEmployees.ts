import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "@/services/employeeService";
import type { Employee } from "@/lib/types/employee";

/**
 * Query key factory for employees
 */
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
};

/**
 * Hook to fetch employees for dropdown selection
 */
export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: async () => {
      const response = await getEmployees();
      return response.data.employees;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - employees don't change often
  });
}
