"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import {
  getAuthCredentials,
  linkPhone,
  logoutAllAuth,
  setAccountPassword,
} from "@/services/authService";
import { clearLocalAvatarCache } from "@/lib/auth/avatarLocalCache";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  AuthAccount,
  AuthAccountCredential,
  AuthCredentialsData,
} from "@/lib/types/auth";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";

type LinkStep = "idle" | "otp";

type ThemeColors = {
  primary: string;
  secondary: string;
};

const DEFAULT_THEME: ThemeColors = {
  primary: "#0f766e",
  secondary: "#0369a1",
};

const THEME_IMAGE_RETRY_MS = 10 * 60 * 1000;
const themeColorCache = new Map<string, ThemeColors>();
const failedThemeImageUntil = new Map<string, number>();

function normalizePhone(input: string): string {
  const trimmed = input.replace(/\s+/g, "");
  if (trimmed.startsWith("+84")) return trimmed;
  return `+84${trimmed.replace(/^0/, "")}`;
}

function isPhoneCredential(item?: AuthAccountCredential): boolean {
  return item?.type?.toLowerCase() === "phone";
}

function isGoogleCredential(item?: AuthAccountCredential): boolean {
  return item?.type?.toLowerCase() === "google";
}

function isEmailCredential(item?: AuthAccountCredential): boolean {
  return item?.type?.toLowerCase() === "email";
}

function dedupeCredentials(
  items: AuthAccountCredential[],
): AuthAccountCredential[] {
  const map = new Map<string, AuthAccountCredential>();
  for (const item of items) {
    const key = `${item.type}:${item.identifier}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function getInitials(fullName?: string): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "BF";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "BF";
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function colorDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function extractThemeFromImage(url: string): Promise<ThemeColors> {
  const cached = themeColorCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const blockedUntil = failedThemeImageUntil.get(url);
  if (blockedUntil && blockedUntil > Date.now()) {
    return Promise.resolve(DEFAULT_THEME);
  }

  if (blockedUntil && blockedUntil <= Date.now()) {
    failedThemeImageUntil.delete(url);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 80;
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(DEFAULT_THEME);
          return;
        }

        context.drawImage(image, 0, 0, size, size);
        const data = context.getImageData(0, 0, size, size).data;
        const counter = new Map<string, number>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 160) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          if (saturation < 0.12) continue;

          const qr = Math.floor(r / 24) * 24;
          const qg = Math.floor(g / 24) * 24;
          const qb = Math.floor(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          counter.set(key, (counter.get(key) ?? 0) + 1);
        }

        const ranked = Array.from(counter.entries())
          .map(([key, count]) => {
            const parts = key.split(",").map((value) => Number(value));
            return {
              rgb: parts as [number, number, number],
              count,
            };
          })
          .sort((left, right) => right.count - left.count);

        if (ranked.length === 0) {
          resolve(DEFAULT_THEME);
          return;
        }

        const primaryRgb = ranked[0].rgb;
        const secondaryCandidate =
          ranked.find((item) => colorDistance(item.rgb, primaryRgb) >= 60)
            ?.rgb ?? ranked[Math.min(1, ranked.length - 1)].rgb;

        const colors = {
          primary: rgbToHex(primaryRgb[0], primaryRgb[1], primaryRgb[2]),
          secondary: rgbToHex(
            secondaryCandidate[0],
            secondaryCandidate[1],
            secondaryCandidate[2],
          ),
        };

        themeColorCache.set(url, colors);
        resolve(colors);
      } catch {
        failedThemeImageUntil.set(url, Date.now() + THEME_IMAGE_RETRY_MS);
        resolve(DEFAULT_THEME);
      }
    };

    image.onerror = () => {
      failedThemeImageUntil.set(url, Date.now() + THEME_IMAGE_RETRY_MS);
      resolve(DEFAULT_THEME);
    };
    image.src = url;
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [credentials, setCredentials] = useState<AuthAccountCredential[]>([]);
  const [accessToken, setAccessToken] = useState("");

  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [linkStep, setLinkStep] = useState<LinkStep>("idle");
  const [linkPhoneInput, setLinkPhoneInput] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [themeColors, setThemeColors] = useState<ThemeColors>(DEFAULT_THEME);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadAuthState = useCallback(() => {
    if (typeof window === "undefined") return;

    const accountRaw = window.localStorage.getItem(AUTH_ACCOUNT_KEY);
    const credentialsRaw = window.localStorage.getItem(AUTH_CREDENTIALS_KEY);
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";

    setAccessToken(token);

    try {
      const parsedAccount = accountRaw
        ? (JSON.parse(accountRaw) as AuthAccount)
        : null;
      const parsedCredentials = credentialsRaw
        ? (JSON.parse(credentialsRaw) as AuthCredentialsData)
        : null;

      const merged = dedupeCredentials([
        ...(parsedAccount?.credentials ?? []),
        ...(parsedCredentials?.credentials ?? []),
      ]);

      setAccount(parsedAccount);
      setCredentials(merged);
    } catch {
      setAccount(null);
      setCredentials([]);
    }
  }, []);

  useEffect(() => {
    loadAuthState();
    const onAuthUpdated = () => loadAuthState();
    window.addEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
  }, [loadAuthState]);

  useEffect(() => {
    if (linkStep === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [linkStep, timer]);

  const phoneCredential = useMemo(
    () => credentials.find((item) => isPhoneCredential(item)),
    [credentials],
  );

  const googleCredential = useMemo(
    () => credentials.find((item) => isGoogleCredential(item)),
    [credentials],
  );

  const emailCredential = useMemo(
    () => credentials.find((item) => isEmailCredential(item)),
    [credentials],
  );

  const hasPassword = account?.hasPassword === true;
  const avatarUrl = account?.avatarUrl?.trim() ?? "";
  const displayName = account?.fullName?.trim() || "Tài khoản BizFlow";
  const roleLabel = account?.role?.trim() || "Thành viên";

  useEffect(() => {
    if (!avatarUrl) {
      setThemeColors(DEFAULT_THEME);
      return;
    }

    let isCancelled = false;

    void extractThemeFromImage(avatarUrl).then((colors) => {
      if (!isCancelled) {
        setThemeColors(colors);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [avatarUrl]);

  const getRecaptchaVerifier = useCallback(() => {
    if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;
    const verifier = new RecaptchaVerifier(
      firebaseAuth,
      "profile-phone-recaptcha",
      {
        size: "invisible",
      },
    );
    recaptchaVerifierRef.current = verifier;
    return verifier;
  }, []);

  const sendOtp = useCallback(
    async (phone: string) => {
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        normalizePhone(phone),
        verifier,
      );
      confirmationResultRef.current = confirmation;
    },
    [getRecaptchaVerifier],
  );

  const startLinkFlow = () => {
    setError("");
    setMessage("");
    setIsLinkingPhone(true);
    setLinkPhoneInput(phoneCredential?.identifier ?? "");
    setOtp(["", "", "", "", "", ""]);
    setLinkStep("idle");
  };

  const handleSendOtp = async () => {
    setError("");
    setMessage("");

    if (!linkPhoneInput) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendOtp(linkPhoneInput);
      setLinkStep("otp");
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("INVALID_PHONE")) {
        setError("Số điện thoại không hợp lệ.");
      } else if (msg.includes("TOO_MANY_REQUESTS") || msg.includes("quota")) {
        setError("Bạn đã gửi quá nhiều yêu cầu OTP. Vui lòng thử lại sau.");
      } else {
        setError("Không thể gửi OTP. Vui lòng thử lại.");
      }
      recaptchaVerifierRef.current = null;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (/^\d*$/.test(value)) {
      const next = [...otp];
      next[index] = value;
      setOtp(next);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setMessage("");

    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    if (!accessToken) {
      setError("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    if (!confirmationResultRef.current) {
      setError("Phiên OTP đã hết hạn. Vui lòng gửi lại mã.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const credential = await confirmationResultRef.current.confirm(otpCode);
      const firebaseIdToken = await credential.user.getIdToken();

      await linkPhone(linkPhoneInput, firebaseIdToken, accessToken);
      const credentialsResult = await getAuthCredentials(accessToken);

      const updatedCredentials = dedupeCredentials([
        ...(credentialsResult.data?.credentials ?? []),
      ]);

      const updatedAccount: AuthAccount = {
        ...(account ?? {}),
        credentials: dedupeCredentials([
          ...(account?.credentials ?? []),
          {
            type: "phone",
            identifier: linkPhoneInput,
          },
        ]),
      };

      setCredentials(updatedCredentials);
      setAccount(updatedAccount);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          AUTH_CREDENTIALS_KEY,
          JSON.stringify(credentialsResult.data ?? {}),
        );
        window.localStorage.setItem(
          AUTH_ACCOUNT_KEY,
          JSON.stringify(updatedAccount),
        );
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
      }

      setMessage("Liên kết số điện thoại thành công.");
      setIsLinkingPhone(false);
      setLinkStep("idle");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("invalid-verification-code") ||
        msg.includes("INVALID_CODE")
      ) {
        setError("Mã OTP không đúng. Vui lòng thử lại.");
      } else {
        setError(msg || "Liên kết số điện thoại thất bại.");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    recaptchaVerifierRef.current = null;
    setIsSendingOtp(true);
    try {
      await sendOtp(linkPhoneInput);
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch {
      setError("Không thể gửi lại OTP. Vui lòng thử lại.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSavePassword = async () => {
    setError("");
    setMessage("");

    if (!accessToken) {
      setError("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await setAccountPassword(newPassword, accessToken);

      const updatedAccount: AuthAccount = {
        ...(account ?? {}),
        hasPassword: true,
      };

      setAccount(updatedAccount);
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Cập nhật mật khẩu thành công.");

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          AUTH_ACCOUNT_KEY,
          JSON.stringify(updatedAccount),
        );
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cập nhật mật khẩu thất bại.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const clearAuthStorage = () => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_CREDENTIALS_KEY);
    window.localStorage.removeItem(AUTH_ACCOUNT_KEY);
    clearLocalAvatarCache();
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  };

  const handleLogoutAllDevices = async () => {
    setError("");
    setMessage("");

    if (!accessToken) {
      setError("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    setIsLoggingOutAll(true);
    try {
      await logoutAllAuth(accessToken);
      clearAuthStorage();
      router.replace("/auth/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đăng xuất mọi thiết bị thất bại.",
      );
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div id="profile-phone-recaptcha" />

      <div className="max-w-4xl mx-auto space-y-6">
        <section
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{
            background: `linear-gradient(130deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
            boxShadow: `0 14px 36px -10px ${themeColors.primary}66, 0 10px 28px -12px ${themeColors.secondary}88`,
          }}
        >
          <div className="pointer-events-none absolute -top-16 -left-14 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-14 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute top-4 right-10 h-2 w-2 rounded-full bg-white/70 animate-pulse" />
          <div className="pointer-events-none absolute top-12 right-24 h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar
              className="h-20 w-20 shrink-0 border border-white/50"
              style={{
                boxShadow:
                  "0 0 0 6px rgba(255,255,255,0.18), 0 0 36px rgba(255,255,255,0.34)",
              }}
            >
              <AvatarImage src={avatarUrl || undefined} alt="Ảnh đại diện" />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-sm text-white/80">Hồ sơ người dùng</p>
              <h1 className="text-2xl font-bold truncate">{displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-white/20 border border-white/45 backdrop-blur-xs">
                  Vai trò: {roleLabel}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 border border-white/45 backdrop-blur-xs">
                  {emailCredential?.identifier ?? "Chưa liên kết email"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Cài đặt tài khoản
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Quản lý thông tin đăng nhập và bảo mật tài khoản BizFlow.
          </p>

          {(error || message) && (
            <div className="space-y-2 mb-5">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={account?.fullName ?? ""}
                readOnly
                className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="text"
                value={emailCredential?.identifier ?? "Chưa liên kết"}
                readOnly
                className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm text-gray-500">Tài khoản Google</p>
                <p className="font-medium text-gray-900">
                  {googleCredential?.identifier ?? "Chưa liên kết"}
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  googleCredential
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {googleCredential ? "Đã liên kết Google" : "Chưa liên kết"}
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium text-gray-900">
                    {phoneCredential?.identifier ?? "Chưa liên kết"}
                  </p>
                </div>
                <button
                  onClick={startLinkFlow}
                  style={{ backgroundColor: themeColors.primary }}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                >
                  {phoneCredential ? "Thay đổi" : "Liên kết số điện thoại"}
                </button>
              </div>

              {isLinkingPhone && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={linkPhoneInput}
                      onChange={(e) => setLinkPhoneInput(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#23C4C1]"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      style={{
                        borderColor: themeColors.primary,
                        color: themeColors.primary,
                      }}
                      className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50"
                    >
                      {isSendingOtp ? "Đang gửi..." : "Gửi OTP"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsLinkingPhone(false);
                      setLinkStep("idle");
                      setError("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Đóng liên kết
                  </button>

                  {linkStep === "otp" && (
                    <>
                      <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-gray-300 focus:border-[#23C4C1] outline-none"
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleVerifyOtp}
                        disabled={otp.some((digit) => !digit) || isVerifyingOtp}
                        style={{ backgroundColor: themeColors.primary }}
                        className="w-full rounded-lg text-white py-2.5 font-medium disabled:opacity-50"
                      >
                        {isVerifyingOtp
                          ? "Đang xác minh..."
                          : "Xác minh và liên kết"}
                      </button>

                      <div className="flex items-center justify-center gap-3 text-sm">
                        <button
                          onClick={handleResendOtp}
                          disabled={!canResend || isSendingOtp}
                          style={{ color: themeColors.primary }}
                          className="disabled:text-gray-400"
                        >
                          Gửi lại mã
                        </button>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">
                          {canResend
                            ? "Bạn có thể gửi lại OTP"
                            : `Gửi lại sau ${timer}s`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bảo mật</h3>
              <p className="text-sm text-gray-500">
                {hasPassword
                  ? "Tài khoản đã có mật khẩu"
                  : "Tài khoản chưa có mật khẩu"}
              </p>
            </div>
            <button
              onClick={() => setShowPasswordForm((prev) => !prev)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              {hasPassword ? "Đổi mật khẩu" : "Thiết lập mật khẩu"}
            </button>
          </div>

          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Đăng xuất mọi thiết bị
                </p>
                <p className="text-sm text-red-600">
                  Kết thúc tất cả phiên đăng nhập trên các thiết bị.
                </p>
              </div>
              <button
                onClick={handleLogoutAllDevices}
                disabled={isLoggingOutAll}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {isLoggingOutAll ? "Đang xử lý..." : "Đăng xuất tất cả"}
              </button>
            </div>
          </div>

          {showPasswordForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#23C4C1]"
              />
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#23C4C1]"
              />
              <button
                onClick={handleSavePassword}
                disabled={isSavingPassword}
                style={{ backgroundColor: themeColors.primary }}
                className="md:col-span-2 rounded-lg text-white py-2.5 font-medium disabled:opacity-50"
              >
                {isSavingPassword ? "Đang lưu..." : "Lưu mật khẩu"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
