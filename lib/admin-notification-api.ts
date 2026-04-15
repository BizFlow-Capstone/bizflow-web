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
  RecipientMode,
  NotificationRecipientGroupPreview,
  BusinessLocationSummary,
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

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function normalizeActionTypeForApi(value?: string | null): string | undefined {
  const normalized = (value ?? "").trim().toUpperCase();

  if (!normalized || normalized === "NONE") {
    return undefined;
  }

  return normalized === "NAVIGATE_TO_SCREEN" ? "NAVIGATE" : normalized;
}

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

// ── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<NotificationTemplate[]> {
  return request<NotificationTemplate[]>("/api/admin/notifications/templates");
}

export async function upsertTemplate(
  eventCode: string,
  payload: Partial<NotificationTemplate>,
): Promise<NotificationTemplate> {
  const normalizedDefaultActionType = normalizeActionTypeForApi(
    payload.defaultActionType,
  );

  return request<NotificationTemplate>(
    `/api/admin/notifications/templates/${encodePathSegment(eventCode)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        notificationType: payload.notificationType,
        titleTemplate: payload.titleTemplate,
        contentTemplate: payload.contentTemplate,
        defaultActionType: normalizedDefaultActionType,
        defaultTargetScreen: payload.defaultTargetScreen,
        defaultActionPayloadJson: payload.defaultActionPayloadJson,
        isActive: payload.isActive,
      }),
    },
  );
}

export async function getTemplateByEventCode(
  eventCode: string,
): Promise<NotificationTemplate> {
  return request<NotificationTemplate>(
    `/api/admin/notifications/templates/${encodePathSegment(eventCode)}`,
  );
}

export async function toggleTemplate(
  eventCode: string,
  isActive: boolean,
): Promise<NotificationTemplate> {
  return request<NotificationTemplate>(
    `/api/admin/notifications/templates/${encodePathSegment(eventCode)}/toggle`,
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

export async function getRecipientModes(): Promise<RecipientMode[]> {
  return request<RecipientMode[]>("/api/admin/notifications/recipient-modes");
}

export async function getAllLocationOwnersPreview(): Promise<NotificationRecipientGroupPreview> {
  return request<NotificationRecipientGroupPreview>(
    "/api/admin/notifications/recipient-groups/all-location-owners",
  );
}

export async function getBusinessLocations(): Promise<
  BusinessLocationSummary[]
> {
  return request<BusinessLocationSummary[]>(
    "/api/admin/notifications/locations",
  );
}

export async function getRecipientGroupPreview(
  locationId: number,
  recipientGroupType: string,
): Promise<NotificationRecipientGroupPreview> {
  const params = new URLSearchParams({ recipientGroupType });
  return request<NotificationRecipientGroupPreview>(
    `/api/admin/notifications/recipient-groups/locations/${locationId}?${params.toString()}`,
  );
}

// ── Dispatches ───────────────────────────────────────────────────────────────

export async function createDispatch(
  payload: CreateDispatchRequest,
): Promise<NotificationDispatch> {
  const normalizedPayload: CreateDispatchRequest = {
    ...payload,
    actionType: normalizeActionTypeForApi(payload.actionType),
  };

  return request<NotificationDispatch>("/api/admin/notifications/dispatches", {
    method: "POST",
    body: JSON.stringify(normalizedPayload),
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

export async function cancelDispatch(
  dispatchId: number,
): Promise<NotificationDispatch> {
  return request<NotificationDispatch>(
    `/api/admin/notifications/dispatches/${dispatchId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function processDueDispatches(): Promise<void> {
  await request<void>("/api/admin/notifications/dispatches/process-due", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
