import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import ScratchBuffingContent from "./ScratchBuffingContent";
import { serviceCards } from "@/app/shared/data/serviceCards";

export default function Page(): ReactNode {
  const serviceData = serviceCards.find(
    (card) => card.titleKey === "scratchBuffing"
  )!;

  return (
    <CommonPageTemplate
      serviceData={serviceData}
      customContent={<ScratchBuffingContent serviceData={serviceData} />}
    />
  );
}
