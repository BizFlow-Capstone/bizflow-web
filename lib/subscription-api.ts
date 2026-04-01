// ---------------------------------------------------------------------------
// Public Subscription Plan API (user-facing)
// ---------------------------------------------------------------------------

import { authFetch } from "@/lib/auth/tokenManager";
import type {
  PublicSubscriptionPlan,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  CurrentSubscription,
  SubscriptionTransaction,
  OwnedLocation,
} from "@/lib/types/subscription";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5139"
).replace(/\/$/, "");

export async function getPublicSubscriptionPlans(): Promise<
  PublicSubscriptionPlan[]
> {
  const res = await authFetch(`${API_BASE_URL}/api/subscription-plans`, {
    cache: "no-store",
  });
  const body = (await res.json()) as ApiEnvelope<PublicSubscriptionPlan[]>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body.data;
}

export async function createCheckoutSession(
  payload: CreateCheckoutRequest,
): Promise<CreateCheckoutResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/subscriptions/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as ApiEnvelope<CreateCheckoutResponse>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || `Checkout failed (${res.status})`);
  }
  return body.data;
}

export async function getOwnedLocations(): Promise<OwnedLocation[]> {
  const res = await authFetch(`${API_BASE_URL}/api/location/me/owned`, {
    cache: "no-store",
  });
  const body = (await res.json()) as ApiEnvelope<OwnedLocation[]>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body.data ?? [];
}

export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  const res = await authFetch(`${API_BASE_URL}/api/subscriptions/current`);
  if (res.status === 404) return null;
  const body = (await res.json()) as ApiEnvelope<CurrentSubscription | null>;
  if (!res.ok || !body.success) return null;
  return body.data;
}

export async function getSubscriptionTransactions(
  page = 1,
  pageSize = 20,
): Promise<SubscriptionTransaction[]> {
  const res = await authFetch(
    `${API_BASE_URL}/api/subscriptions/transactions?page=${page}&pageSize=${pageSize}`,
  );
  const body = (await res.json()) as ApiEnvelope<SubscriptionTransaction[]>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body.data ?? [];
}
