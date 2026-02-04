import { Suspense } from "react";
import ContactSection from "@/widgets/contact-section/ContactSection";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ContactSection />
    </Suspense>
  );
}
