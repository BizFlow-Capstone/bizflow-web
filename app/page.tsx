import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WhyChooseSection from "@/components/landing/WhyChooseSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
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
