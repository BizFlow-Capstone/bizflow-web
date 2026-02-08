"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import FuzzyText from "@/components/FuzzyText";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        {/* Fuzzy 404 Text */}
        <div className="mb-12 flex items-center justify-center">
          <FuzzyText
            baseIntensity={0.15}
            hoverIntensity={0.35}
            enableHover
            fontSize="clamp(6rem, 15vw, 12rem)"
            fontWeight={900}
            color="#ffffff"
            fuzzRange={35}
            direction="horizontal"
            transitionDuration={300}
            className="max-w-full"
          >
            404
          </FuzzyText>
        </div>

        {/* Description */}
        <div className="space-y-4 mb-12 max-w-md">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Trang không tồn tại
          </h1>
          <p className="text-base md:text-lg text-gray-300">
            Rất tiếc, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
            Trang có thể đã bị xóa, di chuyển hoặc không bao giờ tồn tại.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-gray-200 font-semibold"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Về trang chủ
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white hover:text-black font-semibold"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Quay lại
          </Button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>
  );
}
