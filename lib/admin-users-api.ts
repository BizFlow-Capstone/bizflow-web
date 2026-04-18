import { authFetch } from "@/lib/auth/tokenManager";
import type {
  AdminManagedUser,
  AdminUserQueryParams,
  AdminUsersPaginatedResponse,
  CreateAdminConsultantRequest,
  CreateAdminConsultantResponse,
} from "@/lib/types/adminUserManagement";

type ApiEnvelope<T> = {
  success: boolean;
  messageCode?: string;
  message?: string;
  data: T;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5139"
).replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  const res = await authFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return body.data;
}

export async function getAdminUsers(
  query: AdminUserQueryParams,
): Promise<AdminUsersPaginatedResponse<AdminManagedUser>> {
  const params = new URLSearchParams();

  params.set("pageNumber", String(query.pageNumber ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));

  if (query.search && query.search.trim().length > 0) {
    params.set("search", query.search.trim());
  }

  if (query.role && query.role.trim().length > 0) {
    params.set("role", query.role.trim());
  }

  if (typeof query.isActive === "boolean") {
    params.set("isActive", String(query.isActive));
  }

  return request<AdminUsersPaginatedResponse<AdminManagedUser>>(
    `/api/admin/users?${params.toString()}`,
  );
}

export async function revokeAdminUserRefreshTokens(
  accountId: string,
): Promise<void> {
  return request<void>(
    `/api/admin/users/${encodeURIComponent(accountId)}/refresh-tokens`,
    {
      method: "DELETE",
    },
  );
}

export async function createAdminConsultant(
  payload: CreateAdminConsultantRequest,
): Promise<CreateAdminConsultantResponse> {
  return request<CreateAdminConsultantResponse>("/api/admin/consultants", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      fullName: payload.fullName.trim(),
    }),
  });
}

export async function deleteAdminConsultant(accountId: string): Promise<void> {
  return request<void>(
    `/api/admin/consultants/${encodeURIComponent(accountId)}`,
    {
      method: "DELETE",
    },
  );
}
