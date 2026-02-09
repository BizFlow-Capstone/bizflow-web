"use client";

import Link from "next/link";
import { Playfair_Display, Pangolin } from "next/font/google";
import Image from "next/image";
import BlurText from "@/components/reactbits/BlurText";
import ShinyText from "@/components/reactbits/ShinyText";
import GradientText from "@/components/reactbits/GradientText";
import { motion } from "motion/react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const pangolin = Pangolin({
  subsets: ["latin"],
  weight: ["400"],
});

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative h-200 overflow-hidden bg-cover bg-center scroll-mt-24"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80)",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
        <div className="max-w-3xl absolute top-30">
          <div className={`${playfair.className}`}>
            <BlurText
              text="GIẢI PHÁP QUẢN LÝ HỘ KINH DOANH"
              delay={100}
              animateBy="words"
              direction="bottom"
              stepDuration={0.4}
              className="text-5xl font-bold leading-tight text-white md:text-6xl"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
            className="mt-2"
          >
            <span className={`relative inline-block ${pangolin.className}`}>
              <GradientText
                colors={["#CFE5FF", "#23C4C1", "#0ea5e9", "#CFE5FF", "#23C4C1"]}
                animationSpeed={4}
                showBorder={false}
                className="text-5xl font-bold md:text-6xl"
              >
                CHUẨN LUẬT
              </GradientText>
              <Image
                src="/pictures/landingPic/line.svg"
                alt="Underline"
                width={800}
                height={60}
                className="absolute -bottom-4 left-0 h-auto"
              />
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-8"
          >
            <ShinyText
              text="Tự động hoá sổ sách theo 152/2025/TT-BTC — Tính thuế chính xác — Dành cho Bán lẻ."
              color="#e2e8f0"
              shineColor="#ffffff"
              speed={3}
              className="text-base leading-relaxed md:text-lg"
            />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="mt-8"
          >
            <Link
              href="/auth/register"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[#1e3a5f] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#152b47] hover:shadow-2xl hover:scale-105"
            >
              <span className="absolute inset-0 bg-linear-to-r from-[#23C4C1]/0 via-[#23C4C1]/30 to-[#23C4C1]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Dùng Thử Ngay →</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-20 h-32 w-32 rounded-full bg-[#23C4C1]/20 blur-2xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-40 right-40 h-24 w-24 rounded-full bg-[#0ea5e9]/20 blur-2xl"
      />
    </section>
  );
}
