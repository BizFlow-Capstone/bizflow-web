"use client";

import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { registerWithPhone } from "@/services/authService";

const ACCESS_TOKEN_KEY = "bizflow_access_token";
const REFRESH_TOKEN_KEY = "bizflow_refresh_token";
const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";

type Step = "register" | "otp" | "success";

function getDeviceInfo(): string {
  if (typeof window === "undefined") return "";
  return window.navigator?.userAgent ?? "";
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    fullName: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (step === "otp" && timer > 0) {
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
  }, [step, timer]);

  const getRecaptchaVerifier = useCallback(() => {
    if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;
    const verifier = new RecaptchaVerifier(
      firebaseAuth,
      "recaptcha-container",
      {
        size: "invisible",
      },
    );
    recaptchaVerifierRef.current = verifier;
    return verifier;
  }, []);

  const sendOtp = useCallback(
    async (phone: string) => {
      const formatted = phone.startsWith("+84")
        ? phone
        : `+84${phone.replace(/^0/, "")}`;
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        formatted,
        verifier,
      );
      confirmationResultRef.current = confirmation;
    },
    [getRecaptchaVerifier],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.phone || !formData.password || !formData.fullName) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    setIsSendingOtp(true);
    try {
      await sendOtp(formData.phone);
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("TOO_SHORT") || msg.includes("INVALID_PHONE")) {
        setError("Số điện thoại không hợp lệ.");
      } else if (msg.includes("TOO_MANY_REQUESTS") || msg.includes("quota")) {
        setError("Gửi quá nhiều yêu cầu. Vui lòng thử lại sau.");
      } else {
        setError("Không thể gửi OTP. Vui lòng thử lại.");
      }
      recaptchaVerifierRef.current = null;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) return;
    if (!confirmationResultRef.current) {
      setError("Phiên OTP đã hết hạn. Vui lòng gửi lại.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const credential = await confirmationResultRef.current.confirm(otpCode);
      const firebaseIdToken = await credential.user.getIdToken();
      const result = await registerWithPhone(
        formData.phone,
        formData.password,
        firebaseIdToken,
        formData.fullName,
        getDeviceInfo(),
      );
      const authData = result.data ?? {};
      if (typeof window !== "undefined") {
        if (authData.accessToken)
          window.localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
        if (authData.refreshToken)
          window.localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
        if (authData.account)
          window.localStorage.setItem(
            AUTH_ACCOUNT_KEY,
            JSON.stringify(authData.account),
          );
        window.localStorage.setItem(
          AUTH_CREDENTIALS_KEY,
          JSON.stringify({ credentials: authData.account?.credentials ?? [] }),
        );
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
      }
      setStep("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("invalid-verification-code") ||
        msg.includes("INVALID_CODE")
      ) {
        setError("Mã OTP không đúng. Vui lòng thử lại.");
      } else if (msg.includes("PHONE_ALREADY_EXISTS")) {
        setError("Số điện thoại đã được đăng ký. Vui lòng đăng nhập.");
      } else {
        setError(msg || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleResendOtp = async () => {
    setError("");
    recaptchaVerifierRef.current = null;
    setIsSendingOtp(true);
    try {
      await sendOtp(formData.phone);
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

  const handleChangePhone = () => {
    setStep("register");
    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    setError("");
  };

  return (
    <>
      <div id="recaptcha-container" />

      <PublicHeader />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md">
          {step === "register" && (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                Tạo tài khoản
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên của bạn"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full bg-[#23C4C1] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a9b99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? "Đang gửi mã OTP..." : "Đăng ký"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-gray-600">Bạn đã có tài khoản? </span>
                <Link
                  href="/auth/login"
                  className="text-cyan-500 font-medium hover:text-[#23C4C1]"
                >
                  Đi đến đăng nhập
                </Link>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-10 animate-slideUp">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Image
                    src="/pictures/logo.png"
                    alt="BizFlow Logo"
                    width={24}
                    height={24}
                  />
                  <h1 className="text-xl font-bold text-gray-900">BizFlow</h1>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Xác minh số điện thoại
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  Chúng tôi đã gửi mã 6 số đến số điện thoại
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formData.phone}
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-6">
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
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200 hover:border-gray-300"
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center mb-4">{error}</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={otp.some((digit) => !digit) || isLoading}
                className="w-full py-3.5 rounded-xl font-semibold mb-6 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed enabled:bg-[#23C4C1] enabled:text-white enabled:hover:bg-[#1a9b99]"
              >
                {isLoading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>

              <div className="flex items-center justify-center gap-3 text-sm mb-4">
                <button
                  onClick={handleResendOtp}
                  disabled={!canResend || isSendingOtp}
                  className="text-[#23C4C1] font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? "Đang gửi..." : "Gửi lại mã"}
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={handleChangePhone}
                  className="text-[#23C4C1] font-medium hover:underline"
                >
                  Đổi số điện thoại
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
                {canResend
                  ? "Mã đã hết hạn. Vui lòng gửi lại."
                  : `Gửi lại mã sau ${timer}s`}
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-10 animate-scaleIn text-center">
              <Image
                src="/pictures/auth/Container.png"
                alt="Success"
                width={80}
                height={80}
                className="mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Chào mừng đến với BizFlow!
              </h2>
              <p className="text-sm text-gray-600 mb-8">
                Tài khoản của bạn đã đăng ký thành công.
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#23C4C1] text-white py-4 rounded-xl font-semibold hover:bg-[#1a9b99] transition-all duration-200 mb-4"
              >
                Vào trang chủ
              </button>

              <button
                onClick={() => router.push("/auth/login")}
                className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Đến trang đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
