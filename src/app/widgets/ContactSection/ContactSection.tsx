"use client";

import React from "react";
import { useTranslations } from "next-intl";
import EstimateRequestForm from "@/app/shared/ui/EstimateRequestForm/EstimateRequestForm";

import styles from "./ContactSection.module.css";

/**
 * Виджет «Контакты» с формой запроса оценки.
 * – НЕ передаём коллбэки в форму (несериализуемые пропсы).
 * – Оформление (className) и дисклеймер выводим снаружи формы.
 * – Заголовок остаётся в секции.
 */
export default function ContactSection() {
  const t = useTranslations("ContactForm");

  return (
    <section className={styles.section} aria-labelledby="contact-section-title">
      {/* Внешний контейнер для оформления формы */}
      <div className={styles.form}>
        <EstimateRequestForm />

        {/* Дисклеймер выводим отдельно, без прокидывания пропса внутрь формы */}
        <p className={styles.disclaimer}>{t("disclaimer.estimateApprox")}</p>
      </div>
    </section>
  );
}
