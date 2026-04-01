// ---------------------------------------------------------------------------
// Admin Subscription Plan API
// Uses authFetch from tokenManager – same pattern as admin-notification-api.ts
// ---------------------------------------------------------------------------

import { authFetch } from "@/lib/auth/tokenManager";
import type {
  Feature,
  SubscriptionPlan,
  SubscriptionPlanDetail,
  CreatePlanRequest,
  UpdatePlanRequest,
  PatchStatusRequest,
} from "@/lib/types/adminSubscription";

type ApiEnvelope<T> = {
  success: boolean;
  messageCode?: string;
  message?: string;
  data: T;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5139"
).replace(/\/$/, "");

// ── Core request helper ──────────────────────────────────────────────────────

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

// ── Features ─────────────────────────────────────────────────────────────────

export async function getFeatures(): Promise<Feature[]> {
  return request<Feature[]>("/api/admin/features");
}

// ── Subscription Plans ───────────────────────────────────────────────────────

type PaginatedResponse<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const result = await request<PaginatedResponse<SubscriptionPlan>>(
    "/api/admin/subscription-plans?pageSize=200",
  );
  return result.items;
}

export async function getSubscriptionPlan(
  id: number,
): Promise<SubscriptionPlanDetail> {
  return request<SubscriptionPlanDetail>(`/api/admin/subscription-plans/${id}`);
}

export async function createSubscriptionPlan(
  payload: CreatePlanRequest,
): Promise<SubscriptionPlanDetail> {
  return request<SubscriptionPlanDetail>("/api/admin/subscription-plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSubscriptionPlan(
  id: number,
  payload: UpdatePlanRequest,
): Promise<SubscriptionPlan> {
  return request<SubscriptionPlan>(`/api/admin/subscription-plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSubscriptionPlan(id: number): Promise<void> {
  return request<void>(`/api/admin/subscription-plans/${id}`, {
    method: "DELETE",
  });
}

export async function patchPlanStatus(
  id: number,
  payload: PatchStatusRequest,
): Promise<SubscriptionPlan> {
  return request<SubscriptionPlan>(
    `/api/admin/subscription-plans/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
