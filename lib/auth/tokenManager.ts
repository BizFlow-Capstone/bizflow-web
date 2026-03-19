const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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
    headers: { "Content-Type": "application/json", accept: "*/*" },
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
    window.localStorage.setItem(
      AUTH_ACCOUNT_KEY,
      JSON.stringify(raw.data.account),
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
