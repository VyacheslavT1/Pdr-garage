// app/[locale]/page.tsx
import HeroSection from "@/app/widgets/ HeroSection/ HeroSection";
import AboutUs from "@/app/widgets/About/About";
import Services from "@/app/widgets/Services/Services";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <AboutUs />
      <Services />
    </main>
  );
}
