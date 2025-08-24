"use client";

import { StaticImageData } from "next/image";
import LinkButton from "../LinkButton/LinkButton";
import BaseCard from "@/app/shared/ui/BaseCard/BaseCard";

interface ServiceCardProps {
  src: StaticImageData;
  alt: string;
  titleKey: string;
  descKey: string;
  detailsUrl: string;
}

export default function ServiceCard({
  src,
  alt,
  titleKey,
  descKey,
  detailsUrl,
}: ServiceCardProps) {
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
