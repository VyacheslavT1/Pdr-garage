import { ReactNode } from "react";
import { CommonPageTemplate } from "@/shared/ui/common-page-template/CommonPageTemplate";
import { pageTemplate } from "@/shared/config/data/pageData";
import { AboutUs } from "./AboutUs";
import { getTranslations } from "next-intl/server";
import { serviceCards } from "@/shared/config/data/serviceCards";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<ReactNode> {
  const { locale } = await params;
  const contentData = pageTemplate.find((page) => page.titleKey === "aboutUs")!;

  const t = await getTranslations("CommonTemplateData");
  const sideMenuItems = serviceCards.map((item) => ({
    href: `/${locale}/services/${item.titleKey}`,
    label: t(item.titleKey),
  }));

  return (
    <CommonPageTemplate
      contentData={contentData}
      sideMenuItems={sideMenuItems}
      customContent={<AboutUs contentData={contentData} />}
    />
  );
}
