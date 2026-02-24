"use client";

import Link from "next/link";
import GradientText from "@/components/reactbits/GradientText";
import ShinyText from "@/components/reactbits/ShinyText";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export default function CTASection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  return (
    <section
      id="contact"
      className="bg-white py-20 scroll-mt-24"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#1e3a5f] via-[#0d2d50] to-[#0ea5e9] p-12 text-white shadow-2xl"
        >
          {/* Decorative blobs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#23C4C1]/20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
            className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative text-center z-10">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              <GradientText
                colors={["#ffffff", "#23C4C1", "#CFE5FF", "#0ea5e9", "#ffffff"]}
                animationSpeed={5}
                showBorder={false}
                className="text-3xl font-semibold tracking-tight md:text-4xl"
              >
                Sẵn sàng chuyển đổi số cho cửa hàng?
              </GradientText>
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mx-auto mt-4 max-w-2xl"
            >
              <ShinyText
                text="Bắt đầu dùng thử ngay hoặc đăng ký để nhận tư vấn triển khai trong 24h."
                color="#cbd5e1"
                shineColor="#ffffff"
                speed={3.5}
                className="text-base"
              />
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[#1e3a5f] transition-all duration-300 hover:shadow-lg hover:shadow-white/20 hover:scale-105"
              >
                <span className="absolute inset-0 bg-linear-to-r from-[#23C4C1]/0 via-[#23C4C1]/20 to-[#23C4C1]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">Đăng ký dùng thử</span>
              </Link>
              <a
                href="mailto:support@bizflow.local"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/50"
              >
                support@bizflow.local
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
