import { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CommonPageTemplate } from "@/shared/ui/common-page-template/CommonPageTemplate";
import CustomContent from "./CustomContent";
import { article } from "@/shared/config/data/articleCards";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    article.map((item) => ({
      locale,
      slug: item.titleKey,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const contentData = article.find((item) => item.titleKey === slug);
  if (!contentData) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Blog" });
  return {
    title: t(contentData.titleKey),
    description: t(contentData.descKey),
  };
}

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
