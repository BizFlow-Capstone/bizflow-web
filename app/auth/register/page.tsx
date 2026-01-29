"use client";

import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Step = "register" | "otp" | "success";
type RegisterMethod = "phone" | "google";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>("phone");
  const [showLinkPhoneModal, setShowLinkPhoneModal] = useState(false);
  const [linkPhoneNumber, setLinkPhoneNumber] = useState("");
  const [linkOtpSent, setLinkOtpSent] = useState(false);
  const [linkOtpArray, setLinkOtpArray] = useState(["", "", "", "", "", ""]);
  const [linkTimer, setLinkTimer] = useState(10);
  const [canResendLink, setCanResendLink] = useState(false);
  const linkOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkPasswordConfirm, setLinkPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showLinkSuccessModal, setShowLinkSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    fullName: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (linkOtpSent && linkTimer > 0) {
      const interval = setInterval(() => {
        setLinkTimer((prev) => {
          if (prev <= 1) {
            setCanResendLink(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [linkOtpSent, linkTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register:", formData);
    setRegisterMethod("phone");
    setStep("otp");
  };

  const handleGoogleRegister = () => {
    console.log("Register with Google");
    setRegisterMethod("google");
    setStep("success");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

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

  const handleVerifyOtp = () => {
    const otpCode = otp.join("");
    console.log("Verify OTP:", otpCode);
    setStep("success");
  };

  const handleResendOtp = () => {
    setTimer(10);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    console.log("Resend OTP");
  };

  const handleChangePhone = () => {
    setStep("register");
    setOtp(["", "", "", "", "", ""]);
    setTimer(10);
    setCanResend(false);
  };

  const handleLinkAccount = () => {
    if (registerMethod === "google") {
      console.log("Link phone number");
      setShowLinkPhoneModal(true);
    } else {
      console.log("Link Google account");
    }
  };

  const handleSendLinkOtp = () => {
    if (linkPhoneNumber) {
      console.log("Send OTP to:", linkPhoneNumber);
      setLinkOtpSent(true);
      setLinkTimer(10);
      setCanResendLink(false);
    }
  };

  const handleLinkOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (/^\d*$/.test(value)) {
      const newOtp = [...linkOtpArray];
      newOtp[index] = value;
      setLinkOtpArray(newOtp);

      if (value && index < 5) {
        linkOtpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleLinkOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !linkOtpArray[index] && index > 0) {
      linkOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendLinkOtp = () => {
    setLinkTimer(10);
    setCanResendLink(false);
    setLinkOtpArray(["", "", "", "", "", ""]);
    linkOtpRefs.current[0]?.focus();
    console.log("Resend Link OTP");
  };

  const handleVerifyLinkOtp = () => {
    const otpCode = linkOtpArray.join("");
    console.log("Verify link OTP:", otpCode);
    setShowLinkPhoneModal(false);
    setShowPasswordModal(true);
  };

  const handleSetupPassword = () => {
    if (linkPassword && linkPassword === linkPasswordConfirm) {
      console.log("Password set:", linkPassword);
      setShowPasswordModal(false);
      setShowLinkSuccessModal(true);
    }
  };

  const handleSkipPassword = () => {
    setShowPasswordModal(false);
    setShowLinkSuccessModal(true);
  };

  const handleCloseLinkSuccess = () => {
    setShowLinkSuccessModal(false);
    setLinkPhoneNumber("");
    setLinkOtpSent(false);
    setLinkOtpArray(["", "", "", "", "", ""]);
    setLinkPassword("");
    setLinkPasswordConfirm("");
  };

  const isPasswordValid = () => {
    return (
      linkPassword.length >= 8 &&
      /[A-Z]/.test(linkPassword) &&
      /[a-z]/.test(linkPassword) &&
      /[0-9]/.test(linkPassword)
    );
  };

  const handleGoToHome = () => {
    router.push("/dashboard");
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <>
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
                    placeholder="Nhập mật khẩu"
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

                <button
                  type="submit"
                  className="w-full bg-[#23C4C1] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a9b99] hover:shadow-lg hover:shadow-[#23C4C1]/25 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  Đăng ký
                </button>
              </form>

              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">Hoặc</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <button
                onClick={handleGoogleRegister}
                className="w-full border-2 border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 group"
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
                Đăng ký với Google
              </button>

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
                  {formData.phone || "0363053659"}
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-8">
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

              <button
                onClick={handleVerifyOtp}
                disabled={otp.some((digit) => !digit)}
                className="w-full py-3.5 rounded-xl font-semibold mb-6 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed enabled:bg-[#23C4C1] enabled:text-white enabled:hover:bg-[#1a9b99] enabled:hover:shadow-lg enabled:hover:shadow-[#23C4C1]/25"
              >
                Xác thực OTP
              </button>

              <div className="flex items-center justify-center gap-3 text-sm mb-4">
                <button
                  onClick={handleResendOtp}
                  disabled={!canResend}
                  className="text-[#23C4C1] font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  Gửi lại mã
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
                Vì lí do bảo mật, mã xác nhận chỉ có hiệu lực trong {timer} phút
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-10 animate-scaleIn">
              <div className="text-center mb-8">
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
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 mb-6 border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  Bảo vệ tài khoản của bạn
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {registerMethod === "google"
                    ? "Kết nối số điện thoại để dễ dàng đăng nhập và bảo mật."
                    : "Kết nối tài khoản Google để dễ dàng đăng nhập và bảo mật."}
                </p>
                <button
                  onClick={handleLinkAccount}
                  className="w-full bg-white border-2 border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {registerMethod === "google" ? (
                    <>
                      <svg
                        className="w-5 h-5 text-[#23C4C1]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700">
                        Kết nối số điện thoại
                      </span>
                    </>
                  ) : (
                    <>
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
                      <span className="text-gray-700">
                        Kết nối tài khoản Google
                      </span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleGoToHome}
                className="w-full bg-[#23C4C1] text-white py-4 rounded-xl font-semibold hover:bg-[#1a9b99] hover:shadow-lg hover:shadow-[#23C4C1]/25 transition-all duration-200 mb-4"
              >
                Đi đến trang chủ
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Tạm thời bỏ qua
              </button>
            </div>
          )}
        </div>
      </div>

      {showLinkPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10 shadow-2xl animate-scaleIn">
            <button
              onClick={() => {
                setShowLinkPhoneModal(false);
                setLinkOtpSent(false);
                setLinkPhoneNumber("");
                setLinkOtpArray(["", "", "", "", "", ""]);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Liên kết số điện thoại
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder={linkPhoneNumber || "0363053659"}
                    value={linkPhoneNumber}
                    onChange={(e) => setLinkPhoneNumber(e.target.value)}
                    disabled={linkOtpSent}
                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg outline-none disabled:text-gray-500"
                  />
                  <button
                    onClick={handleSendLinkOtp}
                    disabled={!linkPhoneNumber || linkOtpSent}
                    className="px-6 py-3 bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {linkOtpSent ? "Đã gửi" : "Gửi mã"}
                  </button>
                </div>
              </div>

              {linkOtpSent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã xác thực
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Nhập mã 6 chữ số đã được gửi đến số điện thoại của bạn
                    </p>
                    <div className="flex justify-center gap-2.5 mb-4">
                      {linkOtpArray.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            linkOtpRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleLinkOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleLinkOtpKeyDown(index, e)}
                          className="w-11 h-13 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200"
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={handleResendLinkOtp}
                        disabled={!canResendLink}
                        className="text-sm text-[#23C4C1] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        Gửi lại mã
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleVerifyLinkOtp}
                disabled={linkOtpArray.some((digit) => !digit)}
                className="w-full py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed enabled:bg-[#23C4C1] enabled:text-white enabled:hover:bg-[#1a9b99] enabled:hover:shadow-lg enabled:hover:shadow-[#23C4C1]/25"
              >
                Xác nhận
              </button>

              {linkOtpSent && (
                <p className="text-center text-xs text-gray-500">
                  Mã xác thực sẽ hết hạn sau {linkTimer} phút
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10 shadow-2xl animate-scaleIn">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Thiết lập mật khẩu
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Tạo mật khẩu để dễ dàng nhập bằng số điện thoại
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showPassword ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={linkPasswordConfirm}
                    onChange={(e) => setLinkPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#23C4C1]/20 focus:border-[#23C4C1] outline-none transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showPasswordConfirm ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Mật khẩu mạnh nên có:
                </p>
                <ul className="text-sm space-y-2">
                  <li
                    className={`flex items-center gap-2 ${linkPassword.length >= 8 ? "text-green-600" : "text-blue-600"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${linkPassword.length >= 8 ? "bg-green-500" : "bg-blue-400"}`}
                    ></span>
                    <span>Ít nhất 8 ký tự</span>
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[A-Z]/.test(linkPassword) && /[a-z]/.test(linkPassword) ? "text-green-600" : "text-blue-600"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(linkPassword) && /[a-z]/.test(linkPassword) ? "bg-green-500" : "bg-blue-400"}`}
                    ></span>
                    <span>Chữ hoa và chữ thường</span>
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[0-9]/.test(linkPassword) ? "text-green-600" : "text-blue-600"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(linkPassword) ? "bg-green-500" : "bg-blue-400"}`}
                    ></span>
                    <span>Ít nhất một số</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleSetupPassword}
                disabled={
                  !linkPassword ||
                  !linkPasswordConfirm ||
                  linkPassword !== linkPasswordConfirm ||
                  !isPasswordValid()
                }
                className="w-full py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed enabled:bg-[#23C4C1] enabled:text-white enabled:hover:bg-[#1a9b99] enabled:hover:shadow-lg enabled:hover:shadow-[#23C4C1]/25"
              >
                Hoàn tất
              </button>

              <button
                onClick={handleSkipPassword}
                className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
              >
                Bỏ qua
              </button>

              <p className="text-center text-xs text-gray-500">
                Bạn có thể thiết lập mật khẩu sau trong phần cài đặt tài khoản
              </p>
            </div>
          </div>
        </div>
      )}

      {showLinkSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10 text-center shadow-2xl animate-scaleIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full mb-6 shadow-lg shadow-green-200">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Liên kết thành công!
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Tài khoản của bạn giờ đã có thể đăng nhập bằng cả
              <br />
              Số điện thoại và Google.
            </p>

            <div className="flex items-center justify-center gap-6 mb-8 py-4 px-6 bg-gray-50 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">Điện thoại</span>
              </div>

              <div className="text-2xl text-gray-300 font-light">+</div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-orange-50 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                </div>
                <span className="text-xs text-gray-600">Google</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleCloseLinkSuccess();
                handleGoToHome();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 mb-3"
            >
              Về trang chủ
            </button>

            <button
              onClick={handleCloseLinkSuccess}
              className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

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
