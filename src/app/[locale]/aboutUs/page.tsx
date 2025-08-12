import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import { serviceCards } from "@/app/shared/data/serviceCards";
import { AboutUs } from "./AboutUs";

export default function Page(): ReactNode {
  const serviceData = serviceCards.find((card) => card.titleKey === "aboutUs")!;

  return (
    <CommonPageTemplate
      serviceData={serviceData}
      customContent={<AboutUs data={serviceData} />}
    />
  );
}
