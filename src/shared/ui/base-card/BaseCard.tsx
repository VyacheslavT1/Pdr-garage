"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./BaseCard.module.scss";

interface BaseCardProps {
  src: StaticImageData | string;
  alt: string;
  titleKey: string;
  descKey: string;
  detailsUrl: string;
  tNamespace: string;
  linkLabelKey: string;
  LinkWrapper?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
  }>;
  imagePriority?: boolean;
  imageSizes?: string;
  className?: string;
  linkClassName?: string;
}

export default function BaseCard({
  src,
  alt,
  titleKey,
  descKey,
  detailsUrl,
  tNamespace,
  linkLabelKey,
  LinkWrapper,
  imagePriority = false,
  imageSizes = "(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw",
  className,
  linkClassName,
}: BaseCardProps) {
  const t = useTranslations(tNamespace);
  const LinkComponent = LinkWrapper ?? Link;

  return (
    <div className={`${styles.cardWrapper} ${className ?? ""}`}>
      <div className={styles.cardImage}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={imagePriority}
          sizes={imageSizes}
        />
      </div>
      <div className={styles.cardText}>
        <h2 className={styles.cardTitle}>{t(titleKey)}</h2>
        <p className={styles.cardDescription}>{t(descKey)}</p>
        <div className={styles.cardLink}>
          <LinkComponent href={detailsUrl} className={linkClassName ?? ""}>
            {t(linkLabelKey)}
          </LinkComponent>
        </div>
      </div>
    </div>
  );
}
