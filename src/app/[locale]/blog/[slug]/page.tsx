import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CommonPageTemplate } from "@/shared/ui/common-page-template/CommonPageTemplate";
import CustomContent from "./CustomContent";
import { article } from "@/shared/config/data/articleCards";
import { getTranslations } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<ReactNode> {
  const { locale, slug } = await params;
  // текущая статья по slug (у тебя slug = titleKey)
  const contentData = article.find((item) => item.titleKey === slug);
  if (!contentData) {
    notFound();
  }

  // боковое меню = все статьи
  const t = await getTranslations("Blog");
  const sideMenuItems = article.map((item) => ({
    href: `/${locale}/blog/${item.titleKey}`,
    label: t(item.titleKey),
  }));

  const isCustomContent = slug === "pdrMyths" || slug === "parkingDamage";

  let customContent: React.ReactNode | undefined;
  if (isCustomContent) {
    customContent = <CustomContent contentData={contentData} />;
  }

  return (
    <CommonPageTemplate
      contentData={contentData}
      sideMenuItems={sideMenuItems}
      customContent={customContent}
    />
  );
}
