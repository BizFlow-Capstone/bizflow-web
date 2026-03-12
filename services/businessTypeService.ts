import type { BusinessTypeApiResponse } from "@/lib/types/businessType";

/**
 * Business Type Service
 * Pure API calling logic
 */

/**
 * Fetch all business types
 */
export async function getBusinessTypes(): Promise<BusinessTypeApiResponse> {
  const response = await fetch("/api/business-types", {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch business types: ${response.status}`);
  }

  return response.json();
}
