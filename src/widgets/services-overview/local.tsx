"use client";

import ServiceCard from "@/shared/ui/service-card/ServiceCard";
import CardsOverview from "@/shared/ui/cards-overview/CardsOverview";
import { serviceCards } from "@/shared/config/data/serviceCards";
import { useTranslations } from "next-intl";
import styles from "./ServicesOverview.module.css";

export default function ServicesOverview() {
  const t = useTranslations("ServicesOverview");

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
}

