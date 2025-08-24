// BaseCard.tsx

"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./BaseCard.module.css";

interface BaseCardProps {
  src: StaticImageData;
  alt: string;
  titleKey: string;
  descKey: string;
  detailsUrl: string;

  /** Пример: "CommonTemplateData" для услуг или "Blog" для статей */
  tNamespace: string;

  /** Пример: "detailsButton" для услуг или "readMoreLink" для статей */
  linkLabelKey: string;

  /** Кастомный обёрточный компонент ссылки (например, ваш LinkButton) */
  LinkWrapper?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
  }>;

  /** Опционально: приоритет загрузки изображения */
  imagePriority?: boolean;
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
  className,
  linkClassName,
}: BaseCardProps) {
  const t = useTranslations(tNamespace);
  const LinkComponent = LinkWrapper ?? Link;

  return (
    <div className={`${styles.cardWrapper} ${className ?? ""}`}>
      <div className={styles.cardImage}>
        <Image src={src} alt={alt} fill priority={imagePriority} />
      </div>

      <h2 className={styles.cardTitle}>{t(titleKey)}</h2>
      <p className={styles.cardDescription}>{t(descKey)}</p>

      <div className={styles.cardLink}>
        <LinkComponent href={detailsUrl} className={linkClassName}>
          {t(linkLabelKey)}
        </LinkComponent>
      </div>
    </div>
  );
}
