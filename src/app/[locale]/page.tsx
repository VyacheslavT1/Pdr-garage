// app/[locale]/page.tsx
import HeroSection from "@/widgets/hero-section/HeroSection";
import ShortDescription from "@/widgets/short-description/ShortDescription";
import ServicesSwiper from "@/widgets/services-swiper/ServicesSwiper";

export default function Page() {
  return (
    <>
      <HeroSection />
      <ShortDescription />
      <ServicesSwiper />
    </>
  );
}
