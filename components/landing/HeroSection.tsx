"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <section 
      id="home" 
      className="relative min-h-[90vh] bg-[#f8fafc] overflow-hidden flex items-center pt-24 pb-16 lg:pt-32 lg:pb-24 lg:scroll-mt-20"
    >
      {/* Background tĩnh: sáng nhẹ, không dùng animation để chống lag */}
      <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#23C4C1]/10 blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-[#0ea5e9]/10 blur-[120px]" />
      </div>

      {/* Pattern chấm bị nhẹ */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply" 
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #1e3a5f 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Cột trái: Nội dung chính */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#23C4C1]/20 shadow-sm mb-6 text-sm font-medium text-[#1e3a5f]"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#23C4C1]/10 text-[#23C4C1]">
                <Zap className="w-3 h-3" />
              </span>
              Nền tảng Kế toán Thông minh
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold text-[#112440] leading-[1.12] tracking-tight"
            >
              Giải pháp quản lý <br className="hidden sm:block" />
              hộ kinh doanh <br className="hidden lg:block" />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 text-[#23C4C1]">chuẩn luật</span>
                {/* Dấu gạch dưới tĩnh cách điệu */}
                <svg className="absolute -bottom-1.5 left-0 w-full h-3 sm:h-4 text-[#23C4C1]/30 -z-10" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
                  <path fill="currentColor" d="M2.083,6.862c24.22-3.856,58.75-5.917,86.29-6.315c26.23-0.379,45.41,1.134,70.9,3.013c12.23,0.902,23.33,2.83,37.38,4.197c1.19,0.116,1.48,1.467,0.46,1.968c-12.78,6.284-46.7-5.553-65.02-7.009c-29.28-2.327-57.97-1.464-87.31,1.332C24.42,5.808,6.84,8.514,1.4,9.505C0.29,9.704-0.49,7.279,2.083,6.862z"/>
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="mt-6 text-lg sm:text-xl text-slate-500 leading-relaxed font-medium"
            >
              Tự động hoá sổ sách theo 152/2025/TT-BTC — Tính thuế chính xác — Dành cho Bán lẻ.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#23C4C1] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#23C4C1]/20 transition-all hover:bg-[#1fa9a7] hover:-translate-y-0.5"
              >
                Dùng Thử Ngay
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                Khám phá tính năng
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="mt-10 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Dùng thử Miễn phí
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#23C4C1]" />
                Chuẩn hóa tự động
              </div>
            </motion.div>
          </div>

          {/* Cột phải: Các Card Mockup giao diện (Chỉ Entrance Animation) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            {/* Main glass card */}
            <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl shadow-indigo-100/40 rounded-[24px] p-6 lg:ml-8">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-[#112440] text-lg">Tổng quan Tài chính</h3>
                  <p className="text-xs text-slate-500 mt-1">Hôm nay, {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đồng bộ Realtime
                </div>
              </div>

              {/* Box stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80">
                  <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Doanh thu bán hàng</p>
                  <p className="text-2xl font-black text-[#112440]">24,5M ₫</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 w-max px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    +12.5% 
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80">
                  <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Đơn hàng mới</p>
                  <p className="text-2xl font-black text-[#112440]">145</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 w-max px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    +8.2% 
                  </div>
                </div>
              </div>

              {/* Biểu đồ giả mạo */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80">
                <div className="flex justify-between items-end gap-3 h-32">
                  {[40, 60, 45, 80, 50, 100, 75].map((height, i) => (
                    <div key={i} className="flex-1 bg-slate-50 rounded-t-lg relative group overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1.2, delay: 0.4 + i * 0.08, ease: "easeOut" }}
                        className={`absolute bottom-0 w-full rounded-t-lg ${i === 5 ? 'bg-gradient-to-t from-[#23C4C1]/80 to-[#23C4C1]' : 'bg-[#1e3a5f]/10 group-hover:bg-[#1e3a5f]/20 transition-colors'}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[11px] text-slate-400 font-bold">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>

            {/* Thẻ phụ nổi lên bên phải */}
            <motion.div
              animate={{ y: [-5, 5] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute -right-8 top-[20%] z-20 bg-white shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] rounded-2xl p-4 border border-slate-100 w-52"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#112440]">Gợi ý thuế</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Chuẩn TT 152</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Hệ thống tự động tính toán số liệu xuất tờ khai.</p>
            </motion.div>

            {/* Thẻ phụ nằm ở góc dưới bên trái */}
            <motion.div
              animate={{ y: [4, -4] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-6 bottom-16 z-20 bg-[#112440] shadow-xl rounded-2xl p-4 flex items-center gap-3 w-48"
            >
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#23C4C1]" />
               </div>
               <div>
                 <p className="text-[11px] font-medium text-slate-300">Trạng thái sổ</p>
                 <p className="text-sm font-bold text-white">Đã đồng bộ</p>
               </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
