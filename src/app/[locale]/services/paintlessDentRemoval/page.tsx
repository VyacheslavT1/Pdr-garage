import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import { serviceCards } from "@/app/shared/data/serviceCards";

export default function Page(): ReactNode {
  const serviceData = serviceCards.find(
    (card) => card.titleKey === "paintlessDentRemoval"
  )!;

  return <CommonPageTemplate serviceData={serviceData} />;
}
