import type {
  AuthApiResponse,
  AuthCredentialsData,
  GoogleAuthData,
} from "@/lib/types/auth";

function parseResponse<T>(raw: unknown): AuthApiResponse<T> {
  if (!raw || typeof raw !== "object") {
    return { success: false, message: "Invalid response" };
  }
  return raw as AuthApiResponse<T>;
}

export async function loginWithGoogle(
  idToken: string,
  deviceInfo = "",
): Promise<AuthApiResponse<GoogleAuthData>> {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({ idToken, deviceInfo }),
  });

  const raw = await response.json();
  const result = parseResponse<GoogleAuthData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Google login failed");
  }

  return result;
}

export async function setAccountPassword(
  password: string,
  accessToken: string,
): Promise<AuthApiResponse<null>> {
  const response = await fetch("/api/auth/set-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  });

  const raw = await response.json();
  const result = parseResponse<null>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Set password failed");
  }

  return result;
}

export async function getAuthCredentials(
  accessToken: string,
): Promise<AuthApiResponse<AuthCredentialsData>> {
  const response = await fetch("/api/auth/credentials", {
    method: "GET",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const raw = await response.json();
  const result = parseResponse<AuthCredentialsData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Get credentials failed");
  }

  return result;
}

export async function refreshAuthToken(
  refreshToken: string,
  deviceInfo = "",
): Promise<AuthApiResponse<GoogleAuthData>> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({ refreshToken, deviceInfo }),
  });

  const raw = await response.json();
  const result = parseResponse<GoogleAuthData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Refresh token failed");
  }

  return result;
}

export async function logoutAuth(
  refreshToken: string,
  accessToken: string,
  deviceInfo = "",
): Promise<AuthApiResponse<null>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    accept: "*/*",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers,
    body: JSON.stringify({ refreshToken, deviceInfo }),
  });

  const raw = await response.json();
  const result = parseResponse<null>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Logout failed");
  }

  return result;
}
