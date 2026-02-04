import { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CommonPageTemplate } from "@/shared/ui/common-page-template/CommonPageTemplate";
import GlassCrackRepair from "./GlassCrackRepairContent";
import RestorativePolish from "./RestorativePolishContent";
import { serviceCards } from "@/shared/config/data/serviceCards";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    serviceCards.map((item) => ({
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
  const contentData = serviceCards.find((item) => item.titleKey === slug);
  if (!contentData) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: "CommonTemplateData",
  });
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
