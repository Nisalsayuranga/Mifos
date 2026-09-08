import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SellSection } from "@/components/home/SellSection";
import { ValuationSection } from "@/components/home/ValuationSection";
import { FinancingSection } from "@/components/home/FinancingSection";
import { Statistics } from "@/components/home/Statistics";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedProperties />
        <HowItWorks />
        <Statistics />
        <WhyChooseUs />
        <ValuationSection />
        <SellSection />
        <FinancingSection />
      </main>
      <Footer />
    </>
  );
}
