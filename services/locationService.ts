/**
 * Location Service
 * Pure API calling logic - no caching, no state management
 * All caching is handled by TanStack Query in hooks
 */

import type {
  Location,
  ApiResponse,
  NewLocationForm,
} from "@/lib/types/location";

/**
 * Get all owned locations
 * Uses cache: 'no-store' to ensure fresh data for CRUD operations
 */
export async function getLocations(): Promise<ApiResponse<Location[]>> {
  const response = await fetch("/api/locations", {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store", // Always fetch fresh data for dashboard
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new location
 */
export async function createLocation(
  data: NewLocationForm,
): Promise<ApiResponse<Location>> {
  const response = await fetch("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create location: ${response.status}`);
  }

  return response.json();
}

/**
 * Update location status (enable/disable)
 */
export async function updateLocationStatus(
  id: number,
  isActive: boolean,
): Promise<ApiResponse<null>> {
  const response = await fetch(`/api/locations/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update location status: ${response.status}`);
  }

  return response.json();
}

/**
 * Update location details
 */
export async function updateLocation(
  id: number,
  data: Partial<NewLocationForm>,
): Promise<ApiResponse<Location>> {
  const response = await fetch(`/api/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update location: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a location
 */
export async function deleteLocation(id: number): Promise<ApiResponse<null>> {
  const response = await fetch(`/api/locations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete location: ${response.status}`);
  }

  return response.json();
}
