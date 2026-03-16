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

export async function loginWithPhone(
  phone: string,
  password: string,
  deviceInfo = "",
): Promise<AuthApiResponse<GoogleAuthData>> {
  const response = await fetch("/api/auth/login/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({ phone, password, deviceInfo }),
  });

  const raw = await response.json();
  const result = parseResponse<GoogleAuthData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Phone login failed");
  }

  return result;
}

export async function loginWithEmail(
  email: string,
  password: string,
  deviceInfo = "",
): Promise<AuthApiResponse<GoogleAuthData>> {
  const response = await fetch("/api/auth/login/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({ email, password, deviceInfo }),
  });

  const raw = await response.json();
  const result = parseResponse<GoogleAuthData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Email login failed");
  }

  return result;
}

export async function registerWithPhone(
  phone: string,
  password: string,
  firebaseIdToken: string,
  fullName: string,
  deviceInfo = "",
): Promise<AuthApiResponse<GoogleAuthData>> {
  const response = await fetch("/api/auth/register/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({
      phone,
      password,
      firebaseIdToken,
      fullName,
      deviceInfo,
    }),
  });

  const raw = await response.json();
  const result = parseResponse<GoogleAuthData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Phone registration failed");
  }

  return result;
}

export async function linkPhone(
  phone: string,
  firebaseIdToken: string,
  accessToken: string,
  password?: string,
): Promise<AuthApiResponse<unknown>> {
  const response = await fetch("/api/auth/link/phone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      phone,
      firebaseIdToken,
      ...(password ? { password } : {}),
    }),
  });

  const raw = await response.json();
  const result = parseResponse<unknown>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Link phone failed");
  }

  return result;
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
