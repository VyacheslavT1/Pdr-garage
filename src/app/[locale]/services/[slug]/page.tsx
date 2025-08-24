import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import GlassCrackRepair from "./GlassCrackRepairContent";
import RestorativePolish from "./RestorativePolishContent";
import { serviceCards } from "@/app/shared/data/serviceCards";
import { getTranslations } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<ReactNode> {
  // текущая статья по slug (у тебя slug = titleKey)
  const contentData = serviceCards.find(
    (item) => item.titleKey === params.slug
  );
  if (!contentData) {
    notFound();
  }

  // боковое меню = все услуги
  const t = await getTranslations("CommonTemplateData");
  const sideMenuItems = serviceCards.map((item) => ({
    href: `/${params.locale}/services/${item.titleKey}`,
    label: t(item.titleKey),
  }));

  const isGlassCrackRepair = params.slug === "glassCrackRepair";
  const isRestorativePolish = params.slug === "restorativePolish";

  let customContent: React.ReactNode | undefined;
  if (isGlassCrackRepair) {
    customContent = <GlassCrackRepair contentData={contentData} />;
  } else if (isRestorativePolish) {
    customContent = <RestorativePolish contentData={contentData} />;
  }

  return (
    <CommonPageTemplate
      contentData={contentData}
      sideMenuItems={sideMenuItems}
      customContent={customContent}
    />
  );
}
