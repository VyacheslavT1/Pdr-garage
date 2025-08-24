// ServicesOverview.tsx

"use client";

import { useTranslations, useLocale } from "next-intl";
import ServiceCard from "@/app/shared/ui/ServiceCard/ServiceCard";
import CardsOverview from "@/app/shared/ui/CardsOverview/CardsOverview";
import { serviceCards } from "@/app/shared/data/serviceCards";
import styles from "./ServicesOverview.module.css";

const ServicesOverview: React.FC = () => {
  const t = useTranslations("ServicesOverview");
  const locale = useLocale();

  return (
    <div className={styles.contentWrapper}>
      <h1 className={styles.mainTitle}>{t("mainTitle")}</h1>
      <CardsOverview
        items={serviceCards}
        className={styles.optionsContainer}
        renderCardAction={(card, index) => (
          <ServiceCard
            key={index}
            src={card.src}
            alt={card.alt}
            titleKey={card.titleKey}
            descKey={card.descKey}
            detailsUrl={`/services/${card.titleKey}`}
          />
        )}
      />
    </div>
  );
};

export default ServicesOverview;
