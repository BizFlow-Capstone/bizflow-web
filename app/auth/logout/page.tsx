"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutAuth } from "@/services/authService";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";

function getDeviceInfo(): string {
  if (typeof window === "undefined") return "";
  return window.navigator?.userAgent ?? "";
}

function clearAuthStorage() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_CREDENTIALS_KEY);
  window.localStorage.removeItem(AUTH_ACCOUNT_KEY);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const runLogout = async () => {
      const accessToken =
        typeof window !== "undefined"
          ? (window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "")
          : "";
      const refreshToken =
        typeof window !== "undefined"
          ? (window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? "")
          : "";

      try {
        if (refreshToken && accessToken) {
          await logoutAuth(refreshToken, accessToken, getDeviceInfo());
        }
      } catch {
        // Ignore logout API errors and always clear local session state.
      } finally {
        clearAuthStorage();
        if (isMounted) {
          router.replace("/auth/login");
        }
      }
    };

    void runLogout();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-base font-semibold text-gray-900">
          Đang đăng xuất...
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Vui lòng chờ trong giây lát.
        </p>
      </div>
    </div>
  );
}
