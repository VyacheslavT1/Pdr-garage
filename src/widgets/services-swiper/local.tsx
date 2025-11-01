"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/button/Button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { NavigationOptions } from "swiper/types";
import type { Swiper as SwiperInstance } from "swiper";
import ChevronLeft from "@/shared/Icons/chevron-left.svg";
import ChevronRight from "@/shared/Icons/chevron-right.svg";
import { serviceCards } from "@/shared/config/data/serviceCards";
import ServiceCard from "@/shared/ui/service-card/ServiceCard";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "./ServicesSwiper.module.scss";

export default function ServicesSwiper() {
  const t = useTranslations("ServicesSwiper");
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);

  useEffect(() => {
    if (!swiper) return;
    const navParams = swiper.params.navigation as NavigationOptions | undefined;
    if (navParams) {
      navParams.prevEl = prevRef.current;
      navParams.nextEl = nextRef.current;
      swiper.navigation.destroy();
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, [swiper]);

  return (
    <section className={styles.servicesSectionWrapper}>
      <div className={styles.servicesSection}>
        <div className={styles.servicesHeader}>
          <h3>{t("weOffer")}</h3>
          <h2>{t("serviceTypes")}</h2>
        </div>

        <div className={styles.carouselWrapper}>
          <Swiper
            className={styles.swiper}
            modules={[Navigation, Pagination]}
            loop
            slidesPerView={1}
            spaceBetween={16}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 32 },
              992: { slidesPerView: 3, spaceBetween: 48 },
            }}
            onSwiper={setSwiper}
            pagination={{
              el: `.${styles.pagination}`,
              clickable: true,
              renderBullet: (_i, className) => `<span class="${className}"></span>`,
            }}
          >
            {serviceCards.map((card, idx) => (
              <SwiperSlide key={idx} className={styles.slide}>
                <ServiceCard
                  key={idx}
                  src={card.src}
                  alt={card.alt}
                  titleKey={card.titleKey}
                  descKey={card.descKey}
                  detailsUrl={`/services/${card.titleKey}`}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div ref={prevRef} className={`${styles.navButton} ${styles.prev}`}>
            <Button variant="secondary"><ChevronLeft /></Button>
          </div>
          <div ref={nextRef} className={`${styles.navButton} ${styles.next}`}>
            <Button variant="secondary"><ChevronRight /></Button>
          </div>
          <div className={styles.pagination} />
        </div>
      </div>
    </section>
  );
}
