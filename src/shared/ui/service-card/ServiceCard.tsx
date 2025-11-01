"use client";

import { StaticImageData } from "next/image";
import LinkButton from "@/shared/ui/link-button/LinkButton";
import BaseCard from "@/shared/ui/base-card/BaseCard";

interface ServiceCardProps {
  src: StaticImageData | string;
  alt: string;
  titleKey: string;
  descKey: string;
  detailsUrl: string;
}

export default function ServiceCard({ src, alt, titleKey, descKey, detailsUrl }: ServiceCardProps) {
  return (
    <BaseCard
      src={src}
      alt={alt}
      titleKey={titleKey}
      descKey={descKey}
      detailsUrl={detailsUrl}
      tNamespace="CommonTemplateData"
      linkLabelKey="detailsButton"
      LinkWrapper={LinkButton}
      imagePriority={false}
    />
  );
}
