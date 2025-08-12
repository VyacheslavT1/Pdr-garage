// app/widgets/Header/serviceOptions.ts
"use client";

import { useTranslations } from "next-intl";

export interface ServiceOptions {
  value: string;
  label: string;
}

export function getServiceOptions(): ServiceOptions[] {
  const t = useTranslations("getServiceOptions");

  return [
    { value: "bodyRepair", label: t("bodyRepair") },
    { value: "spotTouchUp", label: t("spotTouchUp") },
    { value: "paintlessDentRemoval", label: t("paintlessDentRemoval") },
    { value: "scratchBuffing", label: t("scratchBuffing") },
    { value: "glassCrackRepair", label: t("glassCrackRepair") },
    { value: "restorativePolish", label: t("restorativePolish") },
  ];
}
