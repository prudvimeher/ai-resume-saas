import FeaturesSection from "@/components/landing/FeaturesSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import HeroSection from "@/components/landing/HeroSection";
import MetricsSection from "@/components/landing/MetricsSection";
import ProcessSection from "@/components/landing/ProcessSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <HeroSection />
      <MetricsSection />
      <FeaturesSection />
      <ProcessSection />
      <FinalCtaSection />
    </main>
  );
}
