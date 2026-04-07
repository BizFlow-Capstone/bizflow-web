"use client";

import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getAuthCredentials,
  loginWithGoogle,
  loginWithPhone,
  loginWithEmail,
  setAccountPassword,
} from "@/services/authService";
import type { AuthAccount } from "@/lib/types/auth";
import { persistAccountWithLocalAvatar } from "@/lib/auth/avatarLocalCache";
import { getRoleFromToken } from "@/lib/auth/tokenManager";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type LoginMethod = "phone" | "email";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function getDeviceInfo(): string {
  if (typeof window === "undefined") return "";
  return window.navigator?.userAgent ?? "";
}

export default function LoginPage() {
  const router = useRouter();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleSdkReady, setIsGoogleSdkReady] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [pendingAccount, setPendingAccount] = useState<AuthAccount | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const googleInitializedRef = useRef(false);

  const saveTokens = async (
    token: string,
    refresh: string,
    account: AuthAccount | null,
  ): Promise<AuthAccount | null> => {
    if (typeof window === "undefined") return null;

    const accountWithLocalAvatar = await persistAccountWithLocalAvatar(account);

    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (refresh) window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    if (accountWithLocalAvatar)
      window.localStorage.setItem(
        AUTH_ACCOUNT_KEY,
        JSON.stringify(accountWithLocalAvatar),
      );
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));

    return accountWithLocalAvatar ?? null;
  };

  const handleAfterAuth = useCallback(
    async (token: string, account?: AuthAccount | null) => {
      const credentialsResult = await getAuthCredentials(token);
      if (typeof window !== "undefined") {
        const accountWithLocalAvatar = await persistAccountWithLocalAvatar(
          account ?? null,
        );
        if (account)
          window.localStorage.setItem(
            AUTH_ACCOUNT_KEY,
            JSON.stringify(accountWithLocalAvatar),
          );
        window.localStorage.setItem(
          AUTH_CREDENTIALS_KEY,
          JSON.stringify(credentialsResult.data ?? {}),
        );
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
      }

      const role = getRoleFromToken(token);
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    },
    [router],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      let result;
      if (loginMethod === "phone") {
        if (!formData.phone || !formData.password) {
          setError("Vui lòng nhập số điện thoại và mật khẩu.");
          return;
        }
        result = await loginWithPhone(
          formData.phone,
          formData.password,
          getDeviceInfo(),
        );
      } else {
        if (!formData.email || !formData.password) {
          setError("Vui lòng nhập email và mật khẩu.");
          return;
        }
        result = await loginWithEmail(
          formData.email,
          formData.password,
          getDeviceInfo(),
        );
      }
      const authData = result.data ?? {};
      const storedAccount = await saveTokens(
        authData.accessToken ?? "",
        authData.refreshToken ?? "",
        authData.account ?? null,
      );
      await handleAfterAuth(authData.accessToken ?? "", storedAccount);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("401") ||
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("credential")
          ? "Sai thông tin đăng nhập. Vui lòng kiểm tra lại."
          : msg || "Đăng nhập thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(
    async (tokenInput: string) => {
      setError("");
      setMessage("");
      if (!tokenInput) {
        setError("Thiếu idToken từ Google");
        return;
      }
      setIsGoogleLoading(true);
      try {
        const result = await loginWithGoogle(tokenInput, getDeviceInfo());
        const authData = result.data ?? {};
        const token = authData.accessToken ?? "";
        const account = authData.account ?? null;
        const hasPassword =
          authData.hasPassword === true || account?.hasPassword === true;
        if (!token) throw new Error("API không trả về accessToken");
        setAccessToken(token);
        const storedAccount = await saveTokens(
          token,
          authData.refreshToken ?? "",
          account,
        );
        setPendingAccount(storedAccount);
        if (!hasPassword) {
          setShowSetPasswordModal(true);
          return;
        }
        await handleAfterAuth(token, storedAccount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login thất bại");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [handleAfterAuth],
  );

  const initializeGoogleIdentity = useCallback(() => {
    if (googleInitializedRef.current) return;
    if (!GOOGLE_CLIENT_ID) {
      setError("Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID trong env");
      return;
    }
    const api = window.google?.accounts?.id;
    if (!api) {
      setError("Google Identity SDK chưa sẵn sàng");
      return;
    }
    api.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const token = response?.credential ?? "";
        if (!token) {
          setError("Google không trả về idToken");
          return;
        }
        void handleGoogleLogin(token);
      },
    });
    googleInitializedRef.current = true;
    setIsGoogleSdkReady(true);
  }, [handleGoogleLogin]);

  const handleGoogleIdentityLogin = useCallback(() => {
    setError("");
    const api = window.google?.accounts?.id;
    if (!api || !isGoogleSdkReady) {
      setError("Hãy thử lại sau 1 lát.");
      return;
    }
    api.prompt();
  }, [isGoogleSdkReady]);

  const handleSetPassword = async () => {
    setError("");
    if (!accessToken) {
      setError("Thiếu accessToken");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu tối thiểu 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }
    setIsSettingPassword(true);
    try {
      await setAccountPassword(newPassword, accessToken);
      setShowSetPasswordModal(false);
      await handleAfterAuth(accessToken, pendingAccount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Set password thất bại");
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleIdentity}
      />
      <PublicHeader />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Đăng nhập
            </h2>

            {/* Login method tabs */}
            <div className="flex rounded-xl border border-gray-200 p-1 mb-6 gap-1">
              {(["phone", "email"] as LoginMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setLoginMethod(m);
                    setError("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${loginMethod === m ? "bg-[#23C4C1] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {m === "phone" ? "Số điện thoại" : "Email"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {loginMethod === "phone" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#23C4C1] text-white py-3 rounded-lg font-semibold hover:bg-[#1a9b99] transition-colors disabled:opacity-60"
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">Hoặc</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleIdentityLogin}
              disabled={isGoogleLoading}
              className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isGoogleLoading
                ? "Đang đăng nhập Google..."
                : "Đăng nhập với Google"}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}
            {message && !error && (
              <p className="mt-3 text-sm text-emerald-600 text-center">
                {message}
              </p>
            )}
            {/* {!error && !isGoogleSdkReady && (
              <p className="mt-3 text-sm text-gray-400 text-center">
                Đang khởi tạo Google SDK...
              </p>
            )} */}

            <div className="mt-6 text-center">
              <span className="text-gray-600">Chưa có tài khoản? </span>
              <Link
                href="/auth/register"
                className="text-[#23C4C1] font-medium hover:text-[#1a9b99]"
              >
                Tạo tài khoản mới
              </Link>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />

      <Dialog open={showSetPasswordModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Thiết lập mật khẩu bắt buộc</DialogTitle>
            <DialogDescription>
              Tài khoản Google chưa có mật khẩu. Vui lòng tạo mật khẩu để hoàn
              tất đăng nhập.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSetPassword}
              disabled={isSettingPassword}
              className="bg-[#23C4C1] hover:bg-[#1a9b99]"
            >
              {isSettingPassword ? "Đang lưu..." : "Xác nhận mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
