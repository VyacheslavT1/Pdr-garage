"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import SideMenuList, { SideMenuItem } from "@/shared/ui/side-menu-list/SideMenuList";
import { ContentData } from "@/app/shared/types/page.types";
import styles from "./CommonPageTemplate.module.css";

interface CommonPageTemplateProps {
  contentData: ContentData;
  customContent?: React.ReactNode;
  sideMenuItems: SideMenuItem[];
}

export function CommonPageTemplate({ contentData, customContent, sideMenuItems }: CommonPageTemplateProps) {
  const t = useTranslations("CommonTemplateData");
  return (
    <div className={styles.contentWrapper}>
      <div className={styles.serviceContainer}>
        <h1 className={styles.mainTitle}>{t(contentData.titleKey)}</h1>
        <div className={styles.contentRow}>
          <div className={styles.mediaSection}>
            <div className={styles.imageContainer}>
              <Image
                src={contentData.src}
                alt={contentData.alt}
                fill
                priority
                className={styles.serviceImage}
                sizes="(min-width: 1280px) 40vw, (min-width: 768px) 60vw, 100vw"
              />
            </div>
            {customContent ? (
              <div className={styles.fullDesc}>{customContent}</div>
            ) : (
              <div className={styles.fullDesc}>
                {contentData.fullDesc1 && <p>{t(contentData.fullDesc1)}</p>}
                {contentData.fullDesc2 && <p>{t(contentData.fullDesc2)}</p>}
                {contentData.fullDesc3 && <p>{t(contentData.fullDesc3)}</p>}
                {contentData.fullDesc4 && <p>{t(contentData.fullDesc4)}</p>}
                {contentData.fullDesc5 && <p>{t(contentData.fullDesc5)}</p>}
              </div>
            )}
          </div>
          <SideMenuList items={sideMenuItems} />
        </div>
      </div>
    </div>
  );
}
