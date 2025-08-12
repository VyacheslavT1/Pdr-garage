import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import { serviceCards } from "@/app/shared/data/serviceCards";
import GlassCrackRepair from "./GlassCrackRepairContent";

export default function Page(): ReactNode {
  const serviceData = serviceCards.find(
    (card) => card.titleKey === "glassCrackRepair"
  )!;

  return (
    <CommonPageTemplate
      serviceData={serviceData}
      customContent={<GlassCrackRepair serviceData={serviceData} />}
    />
  );
}
