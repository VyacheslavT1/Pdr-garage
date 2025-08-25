"use client";

import React from "react";
import { useTranslations } from "next-intl";
import EstimateRequestForm from "@/app/shared/ui/EstimateRequestForm/EstimateRequestForm";
import { COMPANY_ADDRESS } from "@/app/shared/constants/siteInfo";
import Link from "next/link";
import Image from "next/image";
import TeamPhoto from "@/app/shared/Images/team.avif";
import GaragePhoto from "@/app/shared/Images/garage.avif";
import styles from "./ContactSection.module.css";

/**
 * Виджет «Контакты» с формой запроса оценки.
 * – НЕ передаём коллбэки в форму (несериализуемые пропсы).
 * – Оформление (className) и дисклеймер выводим снаружи формы.
 * – Заголовок остаётся в секции.
 */
export default function ContactSection() {
  const t = useTranslations("ContactSection");

  return (
    <>
      {/* Внешний контейнер для оформления формы */}
      <div className={styles.wrapper} aria-labelledby="contact-section-title">
        <h1 className={styles.mainTitle}>{t("mainTitle")}</h1>
        <div className={styles.container}>
          <div className={styles.info}>
            <h2
              id="contact-section-title"
              className={styles.contactSectionTitle}
            >
              <span>PDR STUDIO — </span>
              {t("contactSectionTitle")}
            </h2>
            <div className={styles.geolocation}>
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  COMPANY_ADDRESS
                )}&output=embed`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <p className={styles.getDirection}>
                <Link
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    COMPANY_ADDRESS
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📍 {t("getDirection")}
                </Link>
              </p>
            </div>
            <div className={styles.team}>
              <Image
                src={TeamPhoto}
                alt="Photo of the PDR Studio team"
                width={300}
                height={400}
                className={styles.teamPhoto}
              />
              <Image
                src={GaragePhoto}
                alt="Photo of the PDR Studio garage"
                width={300}
                height={400}
                className={styles.garagePhoto}
              />
            </div>
          </div>
          <EstimateRequestForm />
        </div>
      </div>
    </>
  );
}
