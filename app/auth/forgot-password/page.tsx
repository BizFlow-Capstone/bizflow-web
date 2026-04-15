"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicFooter from "@/components/PublicFooter";
import PublicHeader from "@/components/PublicHeader";
import {
  forgotPasswordReset,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
} from "@/services/authService";

type ForgotStep = "email" | "otp" | "reset" | "success";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const STEP_ITEMS: Array<{
  key: Exclude<ForgotStep, "success">;
  title: string;
  helper: string;
}> = [
  { key: "email", title: "Email", helper: "Xác nhận tài khoản" },
  { key: "otp", title: "OTP", helper: "Nhập mã 6 số" },
  { key: "reset", title: "Mật khẩu mới", helper: "Hoàn tất khôi phục" },
];

function createEmptyOtp() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

function maskEmail(value: string) {
  const [name = "", domain = ""] = value.split("@");
  if (!name || !domain) return value;

  const visiblePrefix = name.slice(0, 2);
  const visibleSuffix = name.length > 4 ? name.slice(-1) : "";
  const maskedMiddle = "*".repeat(
    Math.max(2, name.length - visiblePrefix.length - visibleSuffix.length),
  );

  return `${visiblePrefix}${maskedMiddle}${visibleSuffix}@${domain}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp());
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetAccessToken, setResetAccessToken] = useState("");
  const [otpExpiryMinutes, setOtpExpiryMinutes] = useState<number | null>(null);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastSubmittedOtpRef = useRef("");

  const currentStepIndex =
    step === "success"
      ? STEP_ITEMS.length - 1
      : Math.max(
          0,
          STEP_ITEMS.findIndex((item) => item.key === step),
        );

  const verifyOtpCode = useCallback(
    async (code = otpDigits.join("")) => {
      const normalizedCode = code.replace(/\D/g, "").slice(0, OTP_LENGTH);

      setError("");
      setMessage("");

      if (normalizedCode.length !== OTP_LENGTH) {
        setError("Vui lòng nhập đúng mã OTP 6 số.");
        return;
      }

      lastSubmittedOtpRef.current = normalizedCode;
      setIsVerifyingOtp(true);
      try {
        const result = await forgotPasswordVerifyOtp(
          email.trim(),
          normalizedCode,
        );
        const token = result.data?.accessToken ?? "";

        if (!token) {
          throw new Error("Không nhận được token đặt lại mật khẩu.");
        }

        setResetAccessToken(token);
        setMessage(result.message || "Xác minh OTP thành công.");
        setStep("reset");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xác minh OTP thất bại.");
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [email, otpDigits],
  );

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = window.setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => window.clearInterval(interval);
    }
  }, [step, timer]);

  useEffect(() => {
    if (step !== "otp" || isVerifyingOtp || otpDigits.some((digit) => !digit)) {
      return;
    }

    const joinedOtp = otpDigits.join("");
    if (
      joinedOtp.length !== OTP_LENGTH ||
      lastSubmittedOtpRef.current === joinedOtp
    ) {
      return;
    }

    void verifyOtpCode(joinedOtp);
  }, [isVerifyingOtp, otpDigits, step, verifyOtpCode]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Vui lòng nhập email đã đăng ký.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const result = await forgotPasswordSendOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setOtpDigits(createEmptyOtp());
      setResetAccessToken("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpExpiryMinutes(result.data?.expiryMinutes ?? null);
      setTimer(RESEND_SECONDS);
      setCanResend(false);
      lastSubmittedOtpRef.current = "";
      setMessage(
        result.message ||
          "Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.",
      );
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    lastSubmittedOtpRef.current = "";
    await verifyOtpCode();
  };

  const handleOtpChange = (index: number, value: string) => {
    const safeValue = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otpDigits];
    nextOtp[index] = safeValue;
    setOtpDigits(nextOtp);

    if (safeValue && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedDigits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    if (!pastedDigits.length) return;

    const nextOtp = createEmptyOtp();
    pastedDigits.forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtpDigits(nextOtp);
    const focusIndex = Math.min(pastedDigits.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleResendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStep("email");
      return;
    }

    setError("");
    setMessage("");
    setIsSendingOtp(true);
    try {
      const result = await forgotPasswordSendOtp(normalizedEmail);
      setOtpDigits(createEmptyOtp());
      setOtpExpiryMinutes(result.data?.expiryMinutes ?? null);
      setTimer(RESEND_SECONDS);
      setCanResend(false);
      lastSubmittedOtpRef.current = "";
      setMessage(result.message || "Đã gửi lại mã OTP mới cho email của bạn.");
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    setOtpDigits(createEmptyOtp());
    setResetAccessToken("");
    setOtpExpiryMinutes(null);
    setTimer(RESEND_SECONDS);
    setCanResend(false);
    lastSubmittedOtpRef.current = "";
    setError("");
    setMessage("");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    if (!resetAccessToken) {
      setError("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng xác minh OTP lại.");
      setStep("otp");
      return;
    }

    setIsResettingPassword(true);
    try {
      await forgotPasswordReset(newPassword, resetAccessToken);
      setMessage("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại ngay.");
      setStep("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại.",
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="rounded-2xl border border-[#23C4C1]/15 bg-linear-to-r from-[#ecfeff] via-white to-slate-50 p-5">
            <span className="inline-flex rounded-full bg-[#23C4C1]/10 px-3 py-1 text-xs font-semibold text-[#0f8c8a]">
              Khôi phục tài khoản BizFlow
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Quên mật khẩu
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Quy trình 3 bước rõ ràng: xác nhận email, nhập OTP và đặt mật khẩu
              mới.
            </p>

            <div className="relative mt-5">
              <div className="absolute left-0 right-0 top-4 hidden h-0.5 rounded-full bg-slate-200 sm:block" />
              <div
                className="absolute left-0 top-4 hidden h-0.5 rounded-full bg-[#23C4C1] sm:block"
                style={{
                  width: `${(currentStepIndex / (STEP_ITEMS.length - 1)) * 100}%`,
                }}
              />

              <div className="relative grid grid-cols-3 gap-2">
                {STEP_ITEMS.map((item, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={item.key} className="text-center">
                      <div
                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                          isCompleted
                            ? "border-[#23C4C1] bg-[#23C4C1] text-white"
                            : isCurrent
                              ? "border-[#23C4C1] bg-white text-[#23C4C1] shadow-sm"
                              : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      <p
                        className={`mt-2 text-xs font-semibold sm:text-sm ${
                          isCurrent || isCompleted
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 hidden text-[11px] text-slate-500 sm:block">
                        {item.helper}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {(error || message) && (
            <div className="mt-5 space-y-2">
              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              {message && !error && (
                <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                Nhập đúng email đã đăng ký để nhận mã OTP khôi phục mật khẩu.
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email đăng ký
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full rounded-xl bg-[#23C4C1] py-3 font-semibold text-white transition hover:bg-[#1a9b99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingOtp ? "Đang gửi OTP..." : "Tiếp tục và gửi mã OTP"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Email xác minh
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {maskEmail(email)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Hệ thống sẽ tự xác minh ngay khi bạn nhập đủ 6 số OTP.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mã OTP 6 số
                </label>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={`${index}-${step}`}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="h-14 w-full rounded-xl border-2 border-slate-200 text-center text-xl font-bold text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {isVerifyingOtp
                      ? "Đang xác minh mã OTP..."
                      : canResend
                        ? "Bạn có thể yêu cầu mã mới."
                        : `Gửi lại mã sau ${timer}s`}
                  </p>
                  {otpExpiryMinutes && (
                    <p className="mt-1 text-xs text-slate-500">
                      Mã hiện tại có hiệu lực khoảng {otpExpiryMinutes} phút.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Đổi email
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={!canResend || isSendingOtp}
                    className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {isSendingOtp ? "Đang gửi..." : "Gửi lại mã"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={otpDigits.some((digit) => !digit) || isVerifyingOtp}
                className="w-full rounded-xl bg-[#23C4C1] py-3 font-semibold text-white transition hover:bg-[#1a9b99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isVerifyingOtp ? "Đang xác minh..." : "Xác minh ngay"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                OTP đã được xác minh. Hãy đặt mật khẩu mới mạnh và dễ nhớ với
                bạn.
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="rounded-xl border border-slate-300 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Quay lại OTP
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="rounded-xl bg-[#23C4C1] py-3 font-semibold text-white transition hover:bg-[#1a9b99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResettingPassword
                    ? "Đang cập nhật..."
                    : "Đặt lại mật khẩu"}
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="mt-6 space-y-4 text-center">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                Mật khẩu của bạn đã được cập nhật thành công. Hãy đăng nhập lại
                để tiếp tục.
              </div>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="w-full rounded-xl bg-[#23C4C1] py-3 font-semibold text-white transition hover:bg-[#1a9b99]"
              >
                Về trang đăng nhập
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            <span>Đã nhớ mật khẩu? </span>
            <Link
              href="/auth/login"
              className="font-medium text-[#23C4C1] hover:text-[#1a9b99]"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
