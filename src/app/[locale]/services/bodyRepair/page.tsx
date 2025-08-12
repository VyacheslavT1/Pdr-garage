import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import { serviceCards } from "@/app/shared/data/serviceCards";

export default function Page(): ReactNode {
  // находим в массиве нужный объект по ключу titleKey
  const serviceData = serviceCards.find(
    (card) => card.titleKey === "bodyRepair"
  )!;

  return <CommonPageTemplate serviceData={serviceData} />;
}
