// ArticleCard.tsx

"use client";

import { StaticImageData } from "next/image";
import BaseCard from "@/app/shared/ui/BaseCard/BaseCard";
import styles from "./ArticleCard.module.css";

interface ArticleCardProps {
  src: StaticImageData;
  alt: string;
  titleKey: string;
  descKey: string;
  detailsUrl: string;
  className?: string;
}

export default function ArticleCard({
  src,
  alt,
  titleKey,
  descKey,
  detailsUrl,
  className,
}: ArticleCardProps) {
  return (
    <BaseCard
      src={src}
      alt={alt}
      titleKey={titleKey}
      descKey={descKey}
      detailsUrl={detailsUrl}
      tNamespace="Blog"
      linkLabelKey="readMoreLink"
      imagePriority={false}
      className={className}
      linkClassName={styles.articleCardLink}
    />
  );
}
