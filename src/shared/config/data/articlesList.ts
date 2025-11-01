"use client";

import { useTranslations } from "next-intl";

export interface ArticlesList {
  value: string;
  label: string;
}

export function useArticlesList(): ArticlesList[] {
  const t = useTranslations("getArticlesList");
  return [
    { value: "whatIsPDR", label: t("whatIsPDR") },
    { value: "pdrMyths", label: t("pdrMyths") },
    { value: "preservePaint", label: t("preservePaint") },
    { value: "afterPDRCare", label: t("afterPDRCare") },
    { value: "parkingDamage", label: t("parkingDamage") },
    { value: "hailPDR", label: t("hailPDR") },
  ];
}
