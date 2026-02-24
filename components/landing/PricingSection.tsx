"use client";

import Link from "next/link";
import BlurText from "@/components/reactbits/BlurText";
import GradientText from "@/components/reactbits/GradientText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

type Plan = {
  name: string;
  price: string;
  note: string;
  features: string[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Cơ bản",
    price: "0đ",
    note: "Bắt đầu nhanh",
    features: [
      "Ghi chép cơ bản",
      "Nhập/xuất báo cáo",
      "1 người dùng",
      "Xem thống kê đơn giản",
    ],
  },
  {
    name: "Gói phổ biến",
    price: "299.000đ",
    note: "Phù hợp cửa hàng nhỏ",
    highlighted: true,
    features: [
      "Bán hàng + kho",
      "Công nợ khách hàng",
      "Báo cáo lãi/lỗ",
      "Xuất dữ liệu kê khai thuế",
      "Hỗ trợ ưu tiên",
    ],
  },
  {
    name: "Gói nâng cao",
    price: "699.000đ",
    note: "Mở rộng nhiều chi nhánh",
    features: [
      "Tài khoản nhân viên",
      "Phân quyền",
      "Nhiều chi nhánh",
      "Tích hợp nâng cao",
      "Hỗ trợ SLA",
    ],
  },
];

export default function PricingSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="bg-white scroll-mt-24" ref={sectionRef}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center">
          <BlurText
            text="Chọn gói của bạn"
            delay={80}
            animateBy="words"
            direction="top"
            stepDuration={0.35}
            className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mx-auto mt-4 max-w-2xl text-slate-600"
          >
            Minh bạch, dễ nâng cấp. Bạn có thể bắt đầu với gói Free và lên gói
            phù hợp khi cần.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 items-stretch">
          {plans.map((p, index) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              className={p.highlighted ? "md:-mt-4 md:-mb-4" : ""}
            >
              {p.highlighted ? (
                <SpotlightCard
                  className="h-full border-[#23C4C1]/30 bg-[#052659] text-white shadow-2xl shadow-[#052659]/20"
                  spotlightColor="rgba(35, 196, 193, 0.2)"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                      <GradientText
                        colors={["#23C4C1", "#0ea5e9", "#CFE5FF", "#23C4C1"]}
                        animationSpeed={4}
                        showBorder={false}
                        className="text-base font-semibold"
                      >
                        {p.name}
                      </GradientText>
                    </h3>
                    <span className="rounded-full bg-[#23C4C1]/20 px-3 py-1 text-xs font-medium text-[#23C4C1]">
                      Khuyên dùng
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-white/80">{p.note}</p>

                  <div className="mt-6">
                    <p className="text-4xl font-bold">{p.price}</p>
                    <p className="mt-1 text-xs text-white/70">/ tháng</p>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-white/90">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-[#23C4C1]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="/auth/register"
                      className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#052659] transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    >
                      <span className="absolute inset-0 bg-linear-to-r from-[#23C4C1]/0 via-[#23C4C1]/20 to-[#23C4C1]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative">Dùng thử</span>
                    </Link>
                  </div>
                </SpotlightCard>
              ) : (
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">
                      {p.name}
                    </h3>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{p.note}</p>

                  <div className="mt-6">
                    <p className="text-3xl font-semibold text-slate-900">
                      {p.price}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">/ tháng</p>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="/auth/register"
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[#052659] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#031c3f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
                    >
                      Dùng thử
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
