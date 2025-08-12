import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import RestorativePolishContent from "./RestorativePolishContent";
import { serviceCards } from "@/app/shared/data/serviceCards";

export default function Page(): ReactNode {
  const serviceData = serviceCards.find(
    (card) => card.titleKey === "restorativePolish"
  )!;

  return (
    <CommonPageTemplate
      serviceData={serviceData}
      customContent={<RestorativePolishContent serviceData={serviceData} />}
    />
  );
}
