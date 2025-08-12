"use client";

import { useTranslations } from "next-intl";
import ServiceCard from "@/app/shared/ui/ServiceCard/ServiceCard";
import { serviceCards } from "@/app/shared/data/serviceCards";
import styles from "./ServicesOverview.module.css";

const ServicesOverview: React.FC = () => {
  const t = useTranslations("ServicesOverview");

  return (
    <div className={styles.allServices}>
      <h1 className={styles.mainTitle}>{t("mainTitle").toLocaleUpperCase()}</h1>

      <div className={styles.optionsWrapper}>
        {serviceCards.map((card, idx) => (
          <ServiceCard
            key={idx}
            src={card.src}
            alt={card.alt}
            titleKey={card.titleKey}
            descKey={card.descKey}
            detailsUrl={`/services/${card.titleKey}`}
            className={styles.serviceCard}
          />
        ))}
      </div>
    </div>
  );
};
export default ServicesOverview;
