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
  setAccountPassword,
} from "@/services/authService";
import type { AuthAccount, AuthCredentialsData } from "@/lib/types/auth";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type MockLoginUser = {
  phone: string;
  password: string;
  role: "admin" | "accountant";
  fullName: string;
  redirectTo: string;
};

const MOCK_LOGIN_USERS: MockLoginUser[] = [
  {
    phone: "0900000001",
    password: "Admin@123",
    role: "admin",
    fullName: "BizFlow Admin",
    redirectTo: "/dashboard",
  },
  {
    phone: "0900000002",
    password: "Accountant@123",
    role: "accountant",
    fullName: "BizFlow Accountant",
    redirectTo: "/dashboard/reports",
  },
];

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

function createMockToken(phone: string, role: string): string {
  const payload = `${phone}:${role}:${Date.now()}`;
  return `mock_${btoa(payload)}`;
}

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const [googleError, setGoogleError] = useState("");
  const [googleMessage, setGoogleMessage] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [pendingAccount, setPendingAccount] = useState<AuthAccount | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isGoogleSdkReady, setIsGoogleSdkReady] = useState(false);
  const googleInitializedRef = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setGoogleError("");
    setGoogleMessage("");

    const normalizedPhone = formData.phone.trim().replace(/\s+/g, "");
    const normalizedPassword = formData.password.trim();

    const matchedUser = MOCK_LOGIN_USERS.find(
      (user) =>
        user.phone === normalizedPhone && user.password === normalizedPassword,
    );

    if (!matchedUser) {
      setGoogleError("Sai số điện thoại hoặc mật khẩu.");
      return;
    }

    const account: AuthAccount = {
      accountId: `mock-${matchedUser.role}-account`,
      profileId: `mock-${matchedUser.role}-profile`,
      fullName: matchedUser.fullName,
      role: matchedUser.role,
      hasPassword: true,
      credentials: [
        {
          type: "phone",
          identifier: matchedUser.phone,
        },
      ],
    };

    const credentials: AuthCredentialsData = {
      credentials: [
        {
          type: "phone",
          identifier: matchedUser.phone,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const accessToken = createMockToken(matchedUser.phone, matchedUser.role);
    const refreshToken = createMockToken(
      matchedUser.phone,
      `${matchedUser.role}-refresh`,
    );

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      window.localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(account));
      window.localStorage.setItem(
        AUTH_CREDENTIALS_KEY,
        JSON.stringify(credentials),
      );
      window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
    }

    setGoogleMessage(
      `Đăng nhập thành công (${matchedUser.role}). Đang chuyển hướng...`,
    );
    router.push(matchedUser.redirectTo);
  };

  const handleAfterAuth = useCallback(
    async (token: string, account?: AuthAccount | null) => {
      const credentialsResult = await getAuthCredentials(token);

      if (typeof window !== "undefined") {
        if (account) {
          window.localStorage.setItem(
            AUTH_ACCOUNT_KEY,
            JSON.stringify(account),
          );
        }
        window.localStorage.setItem(
          AUTH_CREDENTIALS_KEY,
          JSON.stringify(credentialsResult.data ?? {}),
        );
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
      }

      router.push("/dashboard");
    },
    [router],
  );

  const handleGoogleLogin = useCallback(
    async (tokenInput?: string) => {
      setGoogleError("");
      setGoogleMessage("");

      const idToken = tokenInput ?? "";
      if (!idToken) {
        setGoogleError("Thiếu idToken từ Google");
        return;
      }

      setIsGoogleLoading(true);
      try {
        const result = await loginWithGoogle(idToken, getDeviceInfo());
        const authData = result.data ?? {};
        const token = authData.accessToken ?? "";
        const refreshToken = authData.refreshToken ?? "";
        const account = authData.account ?? null;
        const hasPassword =
          authData.hasPassword === true || account?.hasPassword === true;

        if (!token) {
          throw new Error("API không trả về accessToken");
        }

        setAccessToken(token);
        setPendingAccount(account);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
          if (refreshToken) {
            window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
          if (account) {
            window.localStorage.setItem(
              AUTH_ACCOUNT_KEY,
              JSON.stringify(account),
            );
          }
          window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
        }

        if (!hasPassword) {
          setShowSetPasswordModal(true);
          setGoogleMessage("Tài khoản chưa có mật khẩu. Vui lòng thiết lập.");
          return;
        }

        await handleAfterAuth(token, account);
      } catch (error) {
        setGoogleError(
          error instanceof Error ? error.message : "Google login thất bại",
        );
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [handleAfterAuth],
  );

  const initializeGoogleIdentity = useCallback(() => {
    if (googleInitializedRef.current) return;

    if (!GOOGLE_CLIENT_ID) {
      setGoogleError("Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID trong env");
      return;
    }

    const api = window.google?.accounts?.id;
    if (!api) {
      setGoogleError("Google Identity SDK chưa sẵn sàng");
      return;
    }

    api.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const token = response?.credential ?? "";
        if (!token) {
          setGoogleError("Google không trả về idToken");
          return;
        }
        void handleGoogleLogin(token);
      },
    });

    googleInitializedRef.current = true;
    setIsGoogleSdkReady(true);
  }, [handleGoogleLogin]);

  const handleGoogleIdentityLogin = useCallback(() => {
    setGoogleError("");
    setGoogleMessage("");

    const api = window.google?.accounts?.id;
    if (!api || !isGoogleSdkReady) {
      setGoogleError(
        "Google SDK chưa khởi tạo xong. Hãy thử lại sau 1-2 giây.",
      );
      return;
    }

    api.prompt();
  }, [isGoogleSdkReady]);

  const handleSetPassword = async () => {
    setGoogleError("");
    if (!accessToken) {
      setGoogleError("Thiếu accessToken để set password");
      return;
    }
    if (!password || password.length < 8) {
      setGoogleError("Mật khẩu tối thiểu 8 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setGoogleError("Xác nhận mật khẩu không khớp");
      return;
    }

    setIsSettingPassword(true);
    try {
      await setAccountPassword(password, accessToken);
      setShowSetPasswordModal(false);
      await handleAfterAuth(accessToken, pendingAccount);
    } catch (error) {
      setGoogleError(
        error instanceof Error ? error.message : "Set password thất bại",
      );
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
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Đăng nhập
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại của bạn"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
                />
              </div>

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
                className="w-full bg-[#23C4C1] text-white py-3 rounded-lg font-semibold hover:bg-[#1a9b99] transition-colors"
              >
                Đăng nhập
              </button>
            </form>

            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Tài khoản mock:</p>
              <p>Admin: 0900000001 / Admin@123</p>
              <p>Accountant: 0900000002 / Accountant@123</p>
            </div>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">Hoặc</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="space-y-3">
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
            </div>

            {googleError && (
              <p className="mt-3 text-sm text-red-600 text-center whitespace-pre-line">
                {googleError}
              </p>
            )}
            {googleMessage && !googleError && (
              <p className="mt-3 text-sm text-emerald-600 text-center">
                {googleMessage}
              </p>
            )}
            {!googleError && !isGoogleSdkReady && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                Đang khởi tạo Google SDK...
              </p>
            )}

            <div className="mt-6 text-center">
              <span className="text-gray-600">Bạn đã có tài khoản? </span>
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
              Tài khoản Google của bạn chưa có mật khẩu. Vui lòng tạo mật khẩu
              để hoàn tất đăng nhập.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent outline-none"
            />
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
