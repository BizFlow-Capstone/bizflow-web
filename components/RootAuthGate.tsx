"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomLoading from "@/components/CustomLoading";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WhyChooseSection from "@/components/landing/WhyChooseSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import {
  clearAuthSession,
  getValidAccessToken,
  getRoleFromToken,
} from "@/lib/auth/tokenManager";

export default function RootAuthGate() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkToken() {
      try {
        const token = await getValidAccessToken();
        if (cancelled) return;

        const role = getRoleFromToken(token);
        if (role === "admin") {
          router.replace("/admin");
        } else if (role === "consultant") {
          router.replace("/consultant/accounting");
        } else if (role === "user") {
          router.replace("/dashboard");
        } else {
          clearAuthSession();
          router.replace("/auth/login");
        }
        // Keep showing loading while redirect is in progress
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      }
    }

    checkToken();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isChecking || isAuthenticated) {
    return <CustomLoading />;
  }

  return (
    <>
      <PublicHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WhyChooseSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <PublicFooter />
    </>
  );
}
