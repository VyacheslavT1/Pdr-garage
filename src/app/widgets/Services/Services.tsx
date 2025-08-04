// app/[locale]/components/Services.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Button from "@/app/shared/ui/Button/Button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import ChevronLeft from "@/app/shared/Icons/chevron-left.svg";
import ChevronRight from "@/app/shared/Icons/chevron-right.svg";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "./Services.module.scss";

import service1 from "@/app/shared/Images/service1.avif";
import service2 from "@/app/shared/Images/service2.avif";
import service3 from "@/app/shared/Images/service3.avif";
import service4 from "@/app/shared/Images/service4.avif";
import service5 from "@/app/shared/Images/service5.avif";
import service6 from "@/app/shared/Images/service6.avif";

const slides = [
  {
    src: service1,
    alt: "Service 1",
    titleKey: "bodyRepair",
    descKey: "bodyRepairDesc",
  },
  {
    src: service2,
    alt: "Service 2",
    titleKey: "spotTouchUp",
    descKey: "spotTouchUpDesc",
  },
  {
    src: service3,
    alt: "Service 3",
    titleKey: "paintlessDentRemoval",
    descKey: "paintlessDentRemovalDesc",
  },
  {
    src: service4,
    alt: "Service 4",
    titleKey: "scratchBuffing",
    descKey: "scratchBuffingDesc",
  },
  {
    src: service5,
    alt: "Service 5",
    titleKey: "glassCrackRepair",
    descKey: "glassCrackRepairDesc",
  },
  {
    src: service6,
    alt: "Service 6",
    titleKey: "restorativePolish",
    descKey: "restorativePolishDesc",
  },
];

export default function Services() {
  const t = useTranslations("Services");
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);

  useEffect(() => {
    if (!swiper) return;
    // приводим navigation-параметры к any
    const navParams = swiper.params.navigation as any;
    if (navParams) {
      navParams.prevEl = prevRef.current;
      navParams.nextEl = nextRef.current;
      // пересоздаём навигацию, чтобы Swiper подхватил новые элементы
      swiper.navigation.destroy();
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, [swiper]);

  return (
    <section className={styles.servicesSection}>
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
            768: {
              slidesPerView: 2,
              spaceBetween: 32,
            },
            992: {
              slidesPerView: 3,
              spaceBetween: 48,
            },
          }}
          onSwiper={setSwiper}
          pagination={{
            el: `.${styles.pagination}`,
            clickable: true,
            renderBullet: (_i, className) =>
              `<span class="${className}"></span>`,
          }}
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={idx} className={styles.slide}>
              <div className={styles.slideImage}>
                <Image src={slide.src} alt={slide.alt} fill />
              </div>
              <h2 className={styles.slideTitle}>{t(slide.titleKey)}</h2>
              <p className={styles.slideDescription}>{t(slide.descKey)}</p>
              <div className={styles.slideButton}>
                <Button variant="primary">{t("detailsButton")}</Button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div ref={prevRef} className={`${styles.navButton} ${styles.prev}`}>
          <Button variant="secondary">
            <ChevronLeft />
          </Button>
        </div>
        <div ref={nextRef} className={`${styles.navButton} ${styles.next}`}>
          <Button variant="secondary">
            <ChevronRight />
          </Button>
        </div>
        <div className={styles.pagination} />
      </div>
    </section>
  );
}
