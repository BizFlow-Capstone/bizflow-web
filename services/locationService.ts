/**
 * Location Service
 * Pure API calling logic - no caching, no state management
 * All caching is handled by TanStack Query in hooks
 */

import type {
  Location,
  LocationDetail,
  ApiResponse,
  NewLocationForm,
  UpdateLocationPayload,
  LocationEmployeesResponse,
} from "@/lib/types/location";
import { authFetch } from "@/lib/auth/tokenManager";

/**
 * Get all accessible locations for the current user
 * Includes both owned locations and locations assigned via work-at access
 * Uses cache: 'no-store' to ensure fresh data for CRUD operations
 */
export async function getLocations(): Promise<ApiResponse<Location[]>> {
  const response = await authFetch("/api/locations", {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store", // Always fetch fresh data for dashboard
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  return response.json();
}

type RawLocationDetailEmployee = {
  profileId?: string;
  userId?: string;
  userName?: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  isActive?: boolean;
};

type RawLocationDetail = {
  id: number;
  name: string;
  address: string;
  district: string | null;
  city: string | null;
  phone: string | null;
  taxCode?: string | null;
  isActive: boolean;
  ownerName: string | null;
  employees?: RawLocationDetailEmployee[];
};

export async function getLocationDetail(
  id: number,
): Promise<ApiResponse<LocationDetail>> {
  const response = await authFetch(`/api/locations/${id}`, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch location detail: ${response.status}`);
  }

  const result = (await response.json()) as ApiResponse<RawLocationDetail>;
  const raw = result.data;

  const normalized: LocationDetail = {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    district: raw.district ?? "",
    city: raw.city ?? "",
    phone: raw.phone ?? "",
    taxCode: raw.taxCode ?? null,
    isActive: raw.isActive,
    ownerName: raw.ownerName ?? "",
    employees: (raw.employees ?? []).map((employee) => ({
      userId: employee.profileId ?? employee.userId ?? "",
      userName: employee.userName ?? employee.fullName ?? "",
      phone: employee.phone,
      email: employee.email,
      avatarUrl: employee.avatarUrl,
      status: employee.status,
      isActive: employee.isActive,
    })),
  };

  return {
    ...result,
    data: normalized,
  };
}

/**
 * Create a new location
 */
export async function createLocation(
  data: NewLocationForm,
): Promise<ApiResponse<Location>> {
  const response = await authFetch("/api/locations", {
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
  const response = await authFetch(`/api/locations/${id}/status`, {
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
  data: UpdateLocationPayload,
): Promise<ApiResponse<Location>> {
  const response = await authFetch(`/api/locations/${id}`, {
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
  const response = await authFetch(`/api/locations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete location: ${response.status}`);
  }

  return response.json();
}

/**
 * Get employees assigned to a location
 */
export async function getLocationEmployees(
  locationId: number,
): Promise<ApiResponse<LocationEmployeesResponse>> {
  const response = await authFetch(`/api/locations/${locationId}/employees`, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch location employees: ${response.status}`);
  }

  return response.json();
}

/**
 * Assign employees to a location (replace list)
 */
export async function assignLocationEmployees(
  locationId: number,
  employeeIds: string[],
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/locations/${locationId}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employeeIds),
  });

  if (!response.ok) {
    throw new Error(`Failed to assign location employees: ${response.status}`);
  }

  return response.json();
}
