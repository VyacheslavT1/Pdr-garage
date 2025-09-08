"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import EstimateRequestForm from "@/app/shared/ui/EstimateRequestForm/EstimateRequestForm";
import { COMPANY_ADDRESS } from "@/app/shared/constants/siteInfo";
import Link from "next/link";
import Image from "next/image";
import TeamPhoto from "@/app/shared/Images/team.avif";
import GaragePhoto from "@/app/shared/Images/garage.avif";
import ReviewCreateForm from "@/app/shared/ui/ReviewCreateForm/ReviewCreateForm";
import styles from "./ContactSection.module.css";

type PublishedReview = {
  id: string;
  clientName: string;
  rating?: number | null;
  comment?: string | null;
  date?: string | null;
  adminReply?: string | null;
  adminReplyAuthor?: string | null;
  adminReplyDate?: string | null;
};

function getInitialsFromName(fullName: string): string {
  const safe = (fullName || "").trim().replace(/\s+/g, " ");
  if (!safe) return "•";
  const parts = safe.split(" ");
  if (parts.length >= 2) {
    const first = parts[0][0] || "";
    const last = parts[parts.length - 1][0] || "";
    return (first + last).toUpperCase();
  }
  return (safe[0] || "•").toUpperCase();
}

export default function ContactSection() {
  const t = useTranslations("ContactSection");

  const [publishedReviews, setPublishedReviews] = useState<PublishedReview[]>(
    []
  );
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [reviewsErrorMessage, setReviewsErrorMessage] = useState<string>("");

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPublishedReviews() {
      try {
        setIsLoadingReviews(true);
        setReviewsErrorMessage("");

        const response = await fetch("/api/reviews/public?limit=10", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as { items: PublishedReview[] };
        setPublishedReviews(Array.isArray(json.items) ? json.items : []);
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setReviewsErrorMessage("Impossible de charger les avis publiés.");
        }
      } finally {
        setIsLoadingReviews(false);
      }
    }

    loadPublishedReviews();
    return () => abortController.abort();
  }, []);

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

            {/* ⬇️ FEEDBACK: опубликованные отзывы */}
            <div aria-live="polite">
              {isLoadingReviews && <p>Chargement des avis…</p>}

              {!isLoadingReviews && reviewsErrorMessage && (
                <p>{reviewsErrorMessage}</p>
              )}

              {!isLoadingReviews && !reviewsErrorMessage && (
                <>
                  {publishedReviews.length === 0 ? (
                    <p>Aucun avis publié pour le moment.</p>
                  ) : (
                    <ul className={styles.feedbackList}>
                      {publishedReviews.map((reviewItem) => {
                        const rating =
                          typeof reviewItem.rating === "number"
                            ? reviewItem.rating
                            : 0;
                        const safeRating = Math.max(0, Math.min(5, rating));
                        const stars =
                          "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
                        const initials = getInitialsFromName(
                          reviewItem.clientName
                        );
                        const formattedDate = reviewItem.date
                          ? new Date(reviewItem.date).toLocaleDateString(
                              "fr-FR"
                            )
                          : null;

                        return (
                          <li key={reviewItem.id} className={styles.reviewItem}>
                            {/* 1-я строка: звёзды */}
                            <div
                              className={styles.reviewStars}
                              role="img"
                              aria-label={`Note ${safeRating} sur 5`}
                            >
                              {stars}
                            </div>

                            {/* 2-я строка: аватар + имя */}
                            <div className={styles.reviewHeader}>
                              <span
                                className={styles.avatar}
                                aria-hidden="true"
                              >
                                {initials}
                              </span>
                              <strong className={styles.clientName}>
                                {reviewItem.clientName}
                              </strong>
                            </div>

                            {/* 3-я строка: publier le + дата */}
                            <div className={styles.reviewMeta}>
                              {t("publishedOn")} {formattedDate ?? "—"}
                            </div>

                            {/* Текст отзыва ниже */}
                            {reviewItem.comment && (
                              <p className={styles.reviewText}>
                                {reviewItem.comment}
                              </p>
                            )}
                            {reviewItem.adminReply && (
                              <div className={styles.adminReply}>
                                <div className={styles.adminReplyHeader}>
                                  <span className={styles.adminBadge}>
                                    {t("adminReply.badge")}
                                  </span>
                                  <span className={styles.adminMeta}>
                                    {reviewItem.adminReplyAuthor
                                      ? t("adminReply.by", {
                                          author: reviewItem.adminReplyAuthor,
                                        })
                                      : t("adminReply.byUnknown")}
                                    {" · "}
                                    {reviewItem.adminReplyDate
                                      ? new Date(
                                          reviewItem.adminReplyDate
                                        ).toLocaleDateString("fr-FR")
                                      : "—"}
                                  </span>
                                </div>
                                <p className={styles.adminReplyText}>
                                  {reviewItem.adminReply}
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            <ReviewCreateForm />
          </div>
          <EstimateRequestForm />
        </div>
      </div>
    </>
  );
}
