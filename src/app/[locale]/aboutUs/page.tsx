import { ReactNode } from "react";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import { pageTemplate } from "@/app/shared/data/pageData";
import { AboutUs } from "./AboutUs";
import { getTranslations } from "next-intl/server";
import { serviceCards } from "@/app/shared/data/serviceCards";

export default async function Page({
  params,
}: {
  params: { locale: string };
}): Promise<ReactNode> {
  const contentData = pageTemplate.find((page) => page.titleKey === "aboutUs")!;

  const t = await getTranslations("CommonTemplateData");
  const sideMenuItems = serviceCards.map((item) => ({
    href: `/${params.locale}/services/${item.titleKey}`,
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
