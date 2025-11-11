"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import CardsOverview from "@/shared/ui/cards-overview/CardsOverview";
import ArticleCard from "@/shared/ui/article-card/ArticleCard";
import SideMenuList from "@/shared/ui/side-menu-list/SideMenuList";
import { article } from "@/shared/config/data/articleCards";
import styles from "./BlogArticlesOverview.module.scss";

export default function BlogArticlesOverview() {
  const t = useTranslations("Blog");
  const locale = useLocale();

  const sideMenuItems = article.map((articleItem) => ({
    href: `/${locale}/blog/${articleItem.titleKey}`,
    label: t(articleItem.titleKey),
  }));

  return (
    <div className={styles.contentWrapper}>
      <h1 className={styles.mainTitle}>{t("mainTitle")}</h1>
      <div className={styles.articlesLayout}>
        <CardsOverview
          items={article}
          className={styles.articlesContainer}
          renderCardAction={(art, index) => (
            <ArticleCard
              key={index}
              src={art.src}
              alt={art.alt}
              titleKey={art.titleKey}
              descKey={art.descKey}
              detailsUrl={`/${locale}/blog/${art.titleKey}`}
            />
          )}
        />
        <SideMenuList items={sideMenuItems} />
      </div>
    </div>
  );
}
