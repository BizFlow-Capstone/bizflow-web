import type {
  AuthApiResponse,
  AuthCredentialsData,
  AuthUserProfile,
  FirebaseCustomTokenData,
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

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
  accessToken: string,
): Promise<AuthApiResponse<null>> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const raw = await response.json();
  const result = parseResponse<null>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Change password failed");
  }

  return result;
}

export async function forgotPasswordSendOtp(
  email: string,
): Promise<AuthApiResponse<{ destination?: string; expiryMinutes?: number }>> {
  const response = await fetch("/api/auth/forgot-password/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({ email }),
  });

  const raw = await response.json();
  const result = parseResponse<{ destination?: string; expiryMinutes?: number }>(
    raw,
  );

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Send OTP failed");
  }

  return result;
}

export async function forgotPasswordVerifyOtp(
  email: string,
  otpCode: string,
): Promise<AuthApiResponse<{ verified?: boolean; accessToken?: string }>> {
  const response = await fetch("/api/auth/forgot-password/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({ email, otpCode }),
  });

  const raw = await response.json();
  const result = parseResponse<{ verified?: boolean; accessToken?: string }>(
    raw,
  );

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Verify OTP failed");
  }

  return result;
}

export async function forgotPasswordReset(
  password: string,
  resetAccessToken: string,
): Promise<AuthApiResponse<null>> {
  const response = await fetch("/api/auth/forgot-password/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
      Authorization: `Bearer ${resetAccessToken}`,
    },
    body: JSON.stringify({ password }),
  });

  const raw = await response.json();
  const result = parseResponse<null>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Reset password failed");
  }

  return result;
}

export async function getAuthProfile(
  accessToken: string,
): Promise<AuthApiResponse<AuthUserProfile>> {
  const response = await fetch("/api/auth/profile", {
    method: "GET",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const raw = await response.json();
  const result = parseResponse<AuthUserProfile>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Get profile failed");
  }

  return result;
}

export async function updateAuthProfile(
  payload: { fullName?: string | null; taxCode?: string | null },
  accessToken: string,
): Promise<AuthApiResponse<AuthUserProfile>> {
  const response = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.json();
  const result = parseResponse<AuthUserProfile>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Update profile failed");
  }

  return result;
}

export async function updateAuthProfileAvatar(
  options: { file?: File | null; removeAvatar?: boolean },
  accessToken: string,
): Promise<AuthApiResponse<AuthUserProfile>> {
  const formData = new FormData();

  if (options.file) {
    formData.append("avatar", options.file);
  }

  if (options.removeAvatar) {
    formData.append("removeAvatar", "true");
  }

  const response = await fetch("/api/auth/profile/avatar", {
    method: "PUT",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const raw = await response.json();
  const result = parseResponse<AuthUserProfile>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Update avatar failed");
  }

  return result;
}

export async function deleteAuthAccount(
  password: string,
  accessToken: string,
): Promise<AuthApiResponse<null>> {
  const response = await fetch("/api/auth/delete-account", {
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
    throw new Error(result.message || "Delete account failed");
  }

  return result;
}

export async function getFirebaseCustomToken(
  accessToken: string,
): Promise<AuthApiResponse<FirebaseCustomTokenData>> {
  const response = await fetch("/api/auth/firebase/custom-token", {
    method: "POST",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const raw = await response.json();
  const result = parseResponse<FirebaseCustomTokenData>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Get Firebase custom token failed");
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

export async function logoutAllAuth(
  accessToken: string,
): Promise<AuthApiResponse<null>> {
  const headers: HeadersInit = {
    accept: "*/*",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch("/api/auth/logout-all", {
    method: "POST",
    headers,
  });

  const raw = await response.json();
  const result = parseResponse<null>(raw);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Logout all failed");
  }

  return result;
}
