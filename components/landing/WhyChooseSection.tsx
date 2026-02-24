"use client";

import Image from "next/image";
import BlurText from "@/components/reactbits/BlurText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import CountUp from "@/components/reactbits/CountUp";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const reasons = [
  {
    title: "Thay thế sổ tay truyền thống",
    desc: "Tự động tạo sổ sách theo quy định của Bộ Tài chính",
    icon: "/pictures/landingPic/FIcon1.svg",
  },
  {
    title: "Đúng Luật Thuế",
    desc: "Giúp phân loại doanh thu đúng quy định, hạn chế rủi ro thuế",
    icon: "/pictures/landingPic/FIcon2.svg",
  },
  {
    title: "Hỗ trợ tư vấn",
    desc: "Cập nhật mẫu thuế nhanh chóng\nHỗ trợ bạn khi bạn cần",
    icon: "/pictures/landingPic/FIcon3.svg",
  },
];

const stats = [
  { value: 1000, suffix: "+", label: "Hộ kinh doanh" },
  { value: 99, suffix: "%", label: "Độ chính xác thuế" },
  { value: 24, suffix: "/7", label: "Hỗ trợ kỹ thuật" },
  { value: 5, suffix: " phút", label: "Thiết lập ban đầu" },
];

export default function WhyChooseSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="why"
      className="bg-[#0a1628] py-24 scroll-mt-24"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <BlurText
            text="TẠI SAO CHỌN BIZFLOW?"
            delay={80}
            animateBy="words"
            direction="top"
            stepDuration={0.35}
            className="text-4xl font-bold tracking-tight text-white md:text-5xl"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Giải pháp đáng tin cậy cho hộ kinh doanh Việt Nam
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {reasons.map((r, index) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
            >
              <SpotlightCard
                className="h-full border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-center"
                spotlightColor="rgba(35, 196, 193, 0.15)"
              >
                <div className="flex justify-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="rounded-2xl bg-[#23C4C1]/10 p-5 inline-flex items-center justify-center"
                  >
                    <Image
                      src={r.icon}
                      alt={r.title}
                      width={56}
                      height={56}
                      className="w-14 h-14"
                    />
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{r.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400 whitespace-pre-line">
                  {r.desc}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl border border-slate-700/50 bg-slate-900/30 p-8"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-[#23C4C1] md:text-4xl">
                <CountUp to={stat.value} duration={2.5} separator="," />
                <span>{stat.suffix}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
