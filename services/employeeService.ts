import type { ApiResponse, EmployeeListResponse } from "@/lib/types/employee";

/**
 * Employee Service
 * Pure API calling logic - no React hooks here
 */

/**
 * Fetch all employees for dropdown selection
 */
export async function getEmployees(): Promise<
  ApiResponse<EmployeeListResponse>
> {
  const response = await fetch("/api/employees", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.status}`);
  }

  return response.json();
}
