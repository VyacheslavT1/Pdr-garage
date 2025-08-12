"use client";

import Image, { StaticImageData } from "next/image";
import LinkButton from "../LinkButton/LinkButton";
import styles from "./ServiceCard.module.css";
import { useTranslations } from "next-intl";

interface ServiceCardProps {
  src: StaticImageData;
  alt: string;
  titleKey: string;
  descKey: string;
  detailsUrl: string;
  className?: string;
}

export default function ServiceCard({
  src,
  alt,
  titleKey,
  descKey,
  detailsUrl,
  className = "",
}: ServiceCardProps) {
  const t = useTranslations("ServiceCard");

  return (
    <div className={`${styles.cardWrapper} ${className}`}>
      <div className={styles.cardImage}>
        <div className={styles.image}></div>
        <Image src={src} alt={alt} fill priority />
      </div>
      <h2 className={styles.cardTitle}>{t(titleKey)}</h2>
      <p className={styles.cardDescription}>{t(descKey)}</p>
      <div className={styles.cardLink}>
        <LinkButton href={detailsUrl}>{t("detailsButton")}</LinkButton>
      </div>
    </div>
  );
}
