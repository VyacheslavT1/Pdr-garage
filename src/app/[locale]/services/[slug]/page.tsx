import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CommonPageTemplate } from "@/shared/ui/common-page-template/CommonPageTemplate";
import GlassCrackRepair from "./GlassCrackRepairContent";
import RestorativePolish from "./RestorativePolishContent";
import { serviceCards } from "@/shared/config/data/serviceCards";
import { getTranslations } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<ReactNode> {
  const { locale, slug } = await params;
  // текущая статья по slug (у тебя slug = titleKey)
  const contentData = serviceCards.find(
    (item) => item.titleKey === slug
  );
  if (!contentData) {
    notFound();
  }

  // боковое меню = все услуги
  const t = await getTranslations("CommonTemplateData");
  const sideMenuItems = serviceCards.map((item) => ({
    href: `/${locale}/services/${item.titleKey}`,
    label: t(item.titleKey),
  }));

  const isGlassCrackRepair = slug === "glassCrackRepair";
  const isRestorativePolish = slug === "restorativePolish";

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
