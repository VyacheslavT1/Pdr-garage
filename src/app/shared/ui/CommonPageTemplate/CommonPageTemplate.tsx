// src/app/components/CommonPageTemplate.tsx
"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { getServiceOptions } from "../../data/serviceOptions";
import Link from "next/link";
import styles from "./CommonPageTemplate.module.css";

interface ServiceData {
  src: string;
  alt: string;
  titleKey: string;
  descKey: string;
  fullDesc1?: string;
  fullDesc2?: string;
  fullDesc3?: string;
  fullDesc4?: string;
}

interface CommonPageTemplateProps {
  serviceData: ServiceData;
  customContent?: React.ReactNode;
}

export function CommonPageTemplate({
  serviceData,
  customContent,
}: CommonPageTemplateProps) {
  const t = useTranslations("ServiceCard");
  const options = getServiceOptions();
  return (
    <section className={styles.contentWrapper}>
      <div className={styles.serviceContainer}>
        <h1 className={styles.mainTitle}>{t(serviceData.titleKey)}</h1>
        <div className={styles.contentRow}>
          <div className={styles.mediaSection}>
            <div className={styles.imageContainer}>
              <Image
                src={serviceData.src}
                alt={serviceData.alt}
                fill
                priority
                className={styles.serviceImage}
              />
            </div>

            {customContent ? (
              <div className={styles.fullDesc}>{customContent}</div>
            ) : (
              <div className={styles.fullDesc}>
                {serviceData.fullDesc1 && <p>{t(serviceData.fullDesc1)}</p>}
                {serviceData.fullDesc2 && <p>{t(serviceData.fullDesc2)}</p>}
                {serviceData.fullDesc3 && <p>{t(serviceData.fullDesc3)}</p>}
                {serviceData.fullDesc4 && <p>{t(serviceData.fullDesc4)}</p>}
              </div>
            )}
          </div>
          <aside className={styles.sideMenu}>
            <ul>
              {options.map((opt) => (
                <li key={opt.value} className={styles.menuItem}>
                  <Link href={`/services/${opt.value}`}>{opt.label}</Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
