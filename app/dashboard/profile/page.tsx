"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import {
  getAuthCredentials,
  linkPhone,
  setAccountPassword,
} from "@/services/authService";
import type {
  AuthAccount,
  AuthAccountCredential,
  AuthCredentialsData,
} from "@/lib/types/auth";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";

type LinkStep = "idle" | "otp";

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

export default function ProfilePage() {
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

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div id="profile-phone-recaptcha" />

      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Cai dat tai khoan
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Quan ly thong tin dang nhap va bao mat tai khoan BizFlow.
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
                Ho va ten
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
                value={emailCredential?.identifier ?? "Chua lien ket"}
                readOnly
                className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm text-gray-500">Tai khoan Google</p>
                <p className="font-medium text-gray-900">
                  {googleCredential?.identifier ?? "Chua lien ket"}
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  googleCredential
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {googleCredential ? "Da lien ket Google" : "Chua lien ket"}
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">So dien thoai</p>
                  <p className="font-medium text-gray-900">
                    {phoneCredential?.identifier ?? "Chua lien ket"}
                  </p>
                </div>
                <button
                  onClick={startLinkFlow}
                  className="px-4 py-2 rounded-lg bg-[#23C4C1] text-white text-sm font-medium hover:bg-[#1a9b99] transition-colors"
                >
                  {phoneCredential ? "Thay doi" : "Lien ket so dien thoai"}
                </button>
              </div>

              {isLinkingPhone && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Nhap so dien thoai"
                      value={linkPhoneInput}
                      onChange={(e) => setLinkPhoneInput(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#23C4C1]"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="px-4 py-2 rounded-lg border border-[#23C4C1] text-[#23C4C1] text-sm font-medium disabled:opacity-50"
                    >
                      {isSendingOtp ? "Dang gui..." : "Gui OTP"}
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
                    Dong lien ket
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
                        className="w-full rounded-lg bg-[#23C4C1] text-white py-2.5 font-medium disabled:opacity-50"
                      >
                        {isVerifyingOtp
                          ? "Dang xac minh..."
                          : "Xac minh va lien ket"}
                      </button>

                      <div className="flex items-center justify-center gap-3 text-sm">
                        <button
                          onClick={handleResendOtp}
                          disabled={!canResend || isSendingOtp}
                          className="text-[#23C4C1] disabled:text-gray-400"
                        >
                          Gui lai ma
                        </button>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">
                          {canResend
                            ? "Ban co the gui lai OTP"
                            : `Gui lai sau ${timer}s`}
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
              <h3 className="text-lg font-semibold text-gray-900">Bao mat</h3>
              <p className="text-sm text-gray-500">
                {hasPassword
                  ? "Tai khoan da co mat khau"
                  : "Tai khoan chua co mat khau"}
              </p>
            </div>
            <button
              onClick={() => setShowPasswordForm((prev) => !prev)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              {hasPassword ? "Doi mat khau" : "Thiet lap mat khau"}
            </button>
          </div>

          {showPasswordForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Mat khau moi"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#23C4C1]"
              />
              <input
                type="password"
                placeholder="Nhap lai mat khau"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#23C4C1]"
              />
              <button
                onClick={handleSavePassword}
                disabled={isSavingPassword}
                className="md:col-span-2 rounded-lg bg-[#23C4C1] text-white py-2.5 font-medium disabled:opacity-50"
              >
                {isSavingPassword ? "Dang luu..." : "Luu mat khau"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
