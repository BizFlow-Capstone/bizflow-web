"use client";

import Image from "next/image";
import BlurText from "@/components/reactbits/BlurText";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const features = [
  {
    title: "Bán hàng tốc độ · Quản lý kho chính xác",
    items: [
      "Quét mã vạch (Barcode) tìm hàng trong 1 giây.",
      "Tự động trừ kho ngay khi xuất đơn.",
      "Cảnh báo hàng sắp hết (Low Stock) để nhập kịp thời.",
    ],
    image: "/pictures/landingPic/1.svg",
    accent: "from-cyan-500/10 to-blue-500/10",
  },
  {
    title: "Quản lý Doanh Thu & Chi Phí Tức Thì",
    items: [
      "Số Doanh Thu: Tự động tổng hợp từ đơn hàng bán ra.",
      "Số Chi Phí: Ghi nhanh tiền nhập hàng, điện nước, mặt bằng.",
      "Báo cáo Lãi/Lỗ: Biết ngay lời lãi theo ngày/ tháng.",
    ],
    image: "/pictures/landingPic/2.svg",
    accent: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Hỗ Trợ Kê Khai Thuế",
    items: [
      "Kết xuất dữ liệu chuẩn định dạng của Tổng Cục Thuế.",
      "Tự động tính toán theo phần mềm HTKK.",
      "Nộp thuế nhanh, không cần nhập tay liệu thủ công.",
    ],
    image: "/pictures/landingPic/3.svg",
    accent: "from-amber-500/10 to-orange-500/10",
  },
  {
    title: "Sổ Nợ Điện Tử Minh Bạch",
    items: [
      "Ghi nợ chi tiết từng khách hàng.",
      "Lưu trữ ảnh chuyển khoản/biên nhận.",
      "Nhắc nợ dễ dàng, tránh thất thoát dòng tiền.",
    ],
    image: "/pictures/landingPic/4.svg",
    accent: "from-purple-500/10 to-pink-500/10",
  },
];

function FeatureItem({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -60 : 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`flex flex-col gap-8 items-center ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="flex-1 flex justify-center">
        <div
          className={`rounded-3xl p-12 w-full max-w-md flex items-center justify-center bg-linear-to-br ${feature.accent}`}
        >
          <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative w-full h-64"
          >
            <Image
              src={feature.image}
              alt={feature.title}
              fill
              className="object-contain drop-shadow-lg"
            />
          </motion.div>
        </div>
      </div>

      <div className="flex-1 space-y-6 w-full max-w-md">
        <div>
          <h3 className="text-2xl font-bold text-[#1e3a5f] md:text-3xl leading-tight">
            {feature.title}
          </h3>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "100%" } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-3 h-1 rounded-full bg-linear-to-r from-[#23C4C1] to-[#0ea5e9]"
          />
        </div>

        <ul className="space-y-4">
          {feature.items.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }}
              className="flex gap-3 group"
            >
              <span className="mt-1 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#23C4C1]/10 text-[#23C4C1] text-sm font-bold">
                ✓
              </span>
              <span className="text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                {item}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-20">
          <BlurText
            text="Về Tính Năng"
            delay={100}
            animateBy="words"
            direction="top"
            stepDuration={0.4}
            className="text-4xl font-bold tracking-tight text-[#1e3a5f] md:text-5xl"
          />
          <Image
            src="/pictures/landingPic/line.svg"
            alt="Underline"
            width={300}
            height={60}
            className="h-auto mx-auto"
          />
        </div>

        <div className="space-y-28">
          {features.map((f, index) => (
            <FeatureItem key={f.title} feature={f} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
