// app/[locale]/page.tsx
import HeroSection from "@/app/widgets/ HeroSection/ HeroSection";
import ShortDescription from "@/app/widgets/ShortDescription/ShortDescription";
import ServicesSwiper from "@/app/widgets/ServicesSwiper/ServicesSwiper";

export default function Page() {
  return (
    <>
      <HeroSection />
      <ShortDescription />
      <ServicesSwiper />
    </>
  );
}
