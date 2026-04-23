import type { AuthAccount } from "@/lib/types/auth";
import {
  clearLocalAvatarCache,
  persistAccountWithLocalAvatar,
} from "@/lib/auth/avatarLocalCache";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";
export const LOCALE_KEY = "bizflow_locale";
export const LOCALE_CHANGED_EVENT = "bizflow-locale-changed";
export const LOCALE_HEADER = "Accept-Language";
export type AppLocale = "vi" | "en";

export function getStoredLocale(): AppLocale {
  if (!isBrowser()) return "vi";
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return stored === "en" ? "en" : "vi";
}

export function setStoredLocale(locale: AppLocale) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(
    new CustomEvent(LOCALE_CHANGED_EVENT, { detail: locale }),
  );
}

type RefreshResponse = {
  success?: boolean;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    account?: unknown;
  };
};

type AuthFetchOptions = {
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    const json = atob(payload);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function getRoleFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const role = payload[ROLE_CLAIM];
  return typeof role === "string" ? role : null;
}

function isExpired(token: string, clockSkewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  const exp = payload.exp;
  if (typeof exp !== "number") return true;

  const now = Math.floor(Date.now() / 1000);
  return exp <= now + clockSkewSeconds;
}

function getDeviceInfo(): string {
  if (!isBrowser()) return "";
  return window.navigator?.userAgent ?? "";
}

function getStoredAccessToken(): string {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

function getStoredRefreshToken(): string {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
}

function persistRefreshedTokens(accessToken: string, refreshToken: string) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_CREDENTIALS_KEY);
  window.localStorage.removeItem(AUTH_ACCOUNT_KEY);
  clearLocalAvatarCache();
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

function redirectToLogin() {
  if (!isBrowser()) return;
  if (window.location.pathname.startsWith("/auth/")) return;
  window.location.replace("/auth/login");
}

export async function refreshAndPersistToken(): Promise<string> {
  if (!isBrowser()) {
    throw new Error("Token refresh is only available in browser context");
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
      [LOCALE_HEADER]: getStoredLocale(),
    },
    body: JSON.stringify({ refreshToken, deviceInfo: getDeviceInfo() }),
  });

  const raw = (await response.json().catch(() => ({}))) as RefreshResponse;
  if (!response.ok || !raw.success) {
    throw new Error(raw.message || "Refresh token failed");
  }

  const newAccessToken = raw.data?.accessToken ?? "";
  const newRefreshToken = raw.data?.refreshToken ?? "";

  if (!newAccessToken || !newRefreshToken) {
    throw new Error("Refresh response missing tokens");
  }

  persistRefreshedTokens(newAccessToken, newRefreshToken);
  if (raw.data?.account && isBrowser()) {
    const accountWithLocalAvatar = await persistAccountWithLocalAvatar(
      raw.data.account as AuthAccount,
    );
    window.localStorage.setItem(
      AUTH_ACCOUNT_KEY,
      JSON.stringify(accountWithLocalAvatar),
    );
  }

  return newAccessToken;
}

export async function getValidAccessToken(): Promise<string> {
  const currentAccessToken = getStoredAccessToken();
  if (currentAccessToken && !isExpired(currentAccessToken)) {
    return currentAccessToken;
  }

  return refreshAndPersistToken();
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: AuthFetchOptions = {},
): Promise<Response> {
  const { requiresAuth = true, retryOnUnauthorized = true } = options;

  let accessToken = "";
  if (requiresAuth) {
    try {
      accessToken = await getValidAccessToken();
    } catch {
      clearAuthSession();
      redirectToLogin();
      throw new Error("Unauthorized");
    }
  } else {
    accessToken = getStoredAccessToken();
  }

  const headers = new Headers(init.headers ?? {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  headers.set(LOCALE_HEADER, getStoredLocale());
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getStoredLocale());
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401 || !requiresAuth || !retryOnUnauthorized) {
    return response;
  }

  try {
    const refreshedAccessToken = await refreshAndPersistToken();
    const retryHeaders = new Headers(init.headers ?? {});
    retryHeaders.set("Authorization", `Bearer ${refreshedAccessToken}`);
    retryHeaders.set(LOCALE_HEADER, getStoredLocale());
    if (!retryHeaders.has("Accept-Language")) {
      retryHeaders.set("Accept-Language", getStoredLocale());
    }

    return fetch(input, {
      ...init,
      headers: retryHeaders,
    });
  } catch {
    clearAuthSession();
    redirectToLogin();
    return response;
  }
}
