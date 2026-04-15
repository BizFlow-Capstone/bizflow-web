"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { XCircle, RotateCcw, Home } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a0a0a] via-[#2d1010] to-[#1a0a0a] flex items-center justify-center p-4">
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 sm:p-10 text-center">
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
            className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-red-500/15 border-2 border-red-500/30"
          >
            <XCircle className="w-12 h-12 text-red-400" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Thanh toán bị huỷ
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 text-base mb-8 leading-relaxed"
          >
            Giao dịch đã bị huỷ hoặc thất bại. Bạn chưa bị trừ tiền. Vui lòng
            thử lại hoặc chọn phương thức thanh toán khác.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="group flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-[#052659] hover:bg-[#073a82] active:bg-[#052659] text-white font-semibold text-base py-4 px-5 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-[1.02]"
            >
              <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-45" />
              Thử lại
            </button>

            <button
              onClick={() => router.push("/")}
              className="group flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-base py-4 px-5 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-[1.02]"
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </button>
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-xs text-white/25"
        >
          Nếu bạn đã bị trừ tiền, vui lòng liên hệ hỗ trợ ngay.
        </motion.p>
      </motion.div>
    </div>
  );
}
