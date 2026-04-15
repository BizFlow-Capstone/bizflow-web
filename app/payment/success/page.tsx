"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/dashboard/subscription");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#052659] via-[#073a82] to-[#0a4fa8] flex items-center justify-center p-4">
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#23C4C1]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#23C4C1]/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 sm:p-10 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-[#23C4C1]/20 border-2 border-[#23C4C1]/40"
          >
            <CheckCircle2
              className="w-12 h-12 text-[#23C4C1]"
              strokeWidth={1.5}
            />
          </motion.div>

          {/* Sparkles decorative */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-[#23C4C1]/60" />
            <Sparkles className="w-5 h-5 text-[#23C4C1]" />
            <Sparkles className="w-4 h-4 text-[#23C4C1]/60" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Thanh toán thành công!
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 text-base mb-8 leading-relaxed"
          >
            Gói đăng ký của bạn đang được kích hoạt. Bạn sẽ nhận được thông báo
            ngay khi hoàn tất.
          </motion.p>

          {/* Session ID badge (optional, subtle) */}
          {sessionId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 inline-block rounded-full bg-white/5 border border-white/10 px-4 py-1.5"
            >
              <span className="text-xs text-white/40 font-mono">
                Mã giao dịch: {sessionId.slice(0, 20)}…
              </span>
            </motion.div>
          )}

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="group w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#23C4C1] hover:bg-[#1db3b0] active:bg-[#19a09d] text-white font-semibold text-base py-4 px-6 transition-all duration-200 shadow-lg shadow-[#23C4C1]/20 hover:shadow-[#23C4C1]/30 hover:scale-[1.02]"
            >
              Xem gói đăng ký của tôi
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Countdown */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-5 text-sm text-white/40"
          >
            Tự động chuyển hướng sau{" "}
            <span className="text-white/70 font-semibold tabular-nums">
              {countdown}
            </span>{" "}
            giây…
          </motion.p>
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-xs text-white/30"
        >
          Nếu gói chưa được kích hoạt sau vài phút, vui lòng liên hệ hỗ trợ.
        </motion.p>
      </motion.div>
    </div>
  );
}
