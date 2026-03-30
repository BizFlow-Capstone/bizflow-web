// ---------------------------------------------------------------------------
// Admin Notification API
// Uses authFetch from tokenManager – token is read from localStorage
// key "bizflow_access_token" (set by the normal login flow).
// ---------------------------------------------------------------------------

import { authFetch } from "@/lib/auth/tokenManager";
import type {
  NotificationTemplate,
  NotificationActionCatalog,
  NotificationDispatch,
  CreateDispatchRequest,
  PaginatedResponse,
} from "@/lib/types/adminNotification";

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

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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

// ── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<NotificationTemplate[]> {
  return request<NotificationTemplate[]>(
    "/api/admin/notifications/templates",
  );
}

export async function upsertTemplate(
  eventCode: string,
  payload: Partial<NotificationTemplate>,
): Promise<NotificationTemplate> {
  return request<NotificationTemplate>(
    `/api/admin/notifications/templates/${eventCode}`,
    {
      method: "PUT",
      body: JSON.stringify({
        notificationType: payload.notificationType,
        titleTemplate: payload.titleTemplate,
        contentTemplate: payload.contentTemplate,
        defaultActionType: payload.defaultActionType,
        defaultTargetScreen: payload.defaultTargetScreen,
        defaultActionPayloadJson: payload.defaultActionPayloadJson,
        isActive: payload.isActive,
      }),
    },
  );
}

export async function toggleTemplate(
  eventCode: string,
  isActive: boolean,
): Promise<NotificationTemplate> {
  return request<NotificationTemplate>(
    `/api/admin/notifications/templates/${eventCode}/toggle`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
  );
}

// ── Action catalog ───────────────────────────────────────────────────────────

export async function getActionCatalog(): Promise<NotificationActionCatalog> {
  return request<NotificationActionCatalog>(
    "/api/admin/notifications/action-catalog",
  );
}

// ── Dispatches ───────────────────────────────────────────────────────────────

export async function createDispatch(
  payload: CreateDispatchRequest,
): Promise<NotificationDispatch> {
  return request<NotificationDispatch>("/api/admin/notifications/dispatches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDispatches(
  pageNumber = 1,
  pageSize = 20,
  status?: string,
): Promise<PaginatedResponse<NotificationDispatch>> {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  if (status && status.trim().length > 0) {
    params.set("status", status);
  }
  return request<PaginatedResponse<NotificationDispatch>>(
    `/api/admin/notifications/dispatches?${params.toString()}`,
  );
}

export async function processDueDispatches(): Promise<void> {
  await request<void>("/api/admin/notifications/dispatches/process-due", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
