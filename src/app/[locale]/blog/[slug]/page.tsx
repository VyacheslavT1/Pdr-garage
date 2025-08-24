import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CommonPageTemplate } from "@/app/shared/ui/CommonPageTemplate/CommonPageTemplate";
import CustomContent from "./CustomContent";
import { article } from "@/app/shared/data/articleCards";
import { getTranslations } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<ReactNode> {
  // текущая статья по slug (у тебя slug = titleKey)
  const contentData = article.find((item) => item.titleKey === params.slug);
  if (!contentData) {
    notFound();
  }

  // боковое меню = все статьи
  const t = await getTranslations("Blog");
  const sideMenuItems = article.map((item) => ({
    href: `/${params.locale}/blog/${item.titleKey}`,
    label: t(item.titleKey),
  }));

  const isCustomContent = params.slug === "pdrMyths" || "parkingDamage";

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
