"use client";

import { useTranslations } from "next-intl";
import CheckIcon from "@/app/shared/Icons/check.svg";
import ArrowDownIcon from "@/app/shared/Icons/arrow-down.svg";

interface GlassCrackRepairProps {
  serviceData: ServiceData;
}

interface ServiceData {
  fullDesc?: string;
  fullDescLi1?: string;
  fullDescLi2?: string;
  fullDescLi3?: string;
  fullDescLi4?: string;
  fullDescLi5?: string;
}

export default function GlassCrackRepair({
  serviceData,
}: GlassCrackRepairProps) {
  const t = useTranslations("ServiceCard");

  return (
    <div>
      {serviceData.fullDesc && <p>{t(serviceData.fullDesc)}</p>}
      <ol>
        {serviceData.fullDescLi1 && (
          <li>
            <ArrowDownIcon />
            <span>{t(serviceData.fullDescLi1)}</span>
          </li>
        )}
        {serviceData.fullDescLi2 && (
          <li>
            <ArrowDownIcon />
            <span>{t(serviceData.fullDescLi2)}</span>
          </li>
        )}
        {serviceData.fullDescLi3 && (
          <li>
            <ArrowDownIcon />
            <span>{t(serviceData.fullDescLi3)}</span>
          </li>
        )}
        {serviceData.fullDescLi4 && (
          <li>
            <ArrowDownIcon />
            <span>{t(serviceData.fullDescLi4)}</span>
          </li>
        )}
        {serviceData.fullDescLi5 && (
          <li>
            <CheckIcon />
            <span>{t(serviceData.fullDescLi5)}</span>
          </li>
        )}
      </ol>
    </div>
  );
}
