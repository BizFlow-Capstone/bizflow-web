"use client";

import Link from "next/link";
import { Playfair_Display, Pangolin } from "next/font/google";
import Image from "next/image";

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
        <div className="max-w-3xl">
          <h1
            className={`${playfair.className} text-5xl font-bold leading-tight text-white md:text-6xl`}
          >
            GIẢI PHÁP QUẢN LÝ HỘ KINH DOANH{" "}
            <span
              className={`relative inline-block ${pangolin.className} text-[#23C4C1]`}
            >
              CHUẨN LUẬT
              <Image
                src="/pictures/landingPic/line.svg"
                alt="Underline"
                width={800}
                height={60}
                className="absolute -bottom-4 left-0 w-full h-auto"
              />
            </span>
          </h1>

          <p className="mt-8 text-base leading-relaxed text-slate-200 md:text-lg">
            Tự động hoá sổ sách theo 152/2025/TT-BTC — Tính thuế chính xác —
            Dành cho Bán lẻ.
          </p>

          <div className="mt-8">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-[#152b47]"
            >
              Dùng Thử Ngay →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
