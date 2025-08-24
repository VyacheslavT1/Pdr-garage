// BlogArticlesOverview.tsx

"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import CardsOverview from "@/app/shared/ui/CardsOverview/CardsOverview";
import ArticleCard from "@/app/shared/ui/ArticleCard/ArticleCard";
import SideMenuList from "@/app/shared/ui/SideMenuList/SideMenuList";
import { article } from "@/app/shared/data/articleCards";
import styles from "./BlogArticlesOverview.module.css";

const BlogArticlesOverview: React.FC = () => {
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
};

export default BlogArticlesOverview;
