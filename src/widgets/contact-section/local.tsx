"use client";

import React from "react";
import { useTranslations } from "next-intl";
import EstimateRequestForm from "@/modules/requests/feature/estimate-request/ui/EstimateRequestForm/EstimateRequestForm";
import { COMPANY_ADDRESS } from "@/shared/config/siteInfo";
import Link from "next/link";
import Image from "next/image";
const TeamPhoto = "/images/team.avif" as const;
const GaragePhoto = "/images/garage.avif" as const;
import ReviewCreateForm from "@/modules/reviews/feature/review-create/ui/ReviewCreateForm/ReviewCreateForm";
import styles from "./ContactSection.module.scss";
import {
  getInitialsFromName,
  normalizeName,
  type PublishedReview,
} from "./helpers";

type ContactSectionProps = {
  publishedReviews?: PublishedReview[];
  reviewsErrorMessage?: string | null;
};

export default function ContactSection({
  publishedReviews = [],
  reviewsErrorMessage,
}: ContactSectionProps) {
  const t = useTranslations("ContactSection");

  const safeReviews = Array.isArray(publishedReviews) ? publishedReviews : [];
  const errorMessage = reviewsErrorMessage ?? "";

  return (
    <div className={styles.wrapper} aria-labelledby="contact-section-title">
      <h1 className={styles.mainTitle}>{t("mainTitle")}</h1>
      <div className={styles.container}>
        <div className={styles.info}>
          <h2 id="contact-section-title" className={styles.contactSectionTitle}>
            <span>PDR STUDIO — </span>
            {t("contactSectionTitle")}
          </h2>
          <div className={styles.geolocation}>
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(COMPANY_ADDRESS)}&output=embed`}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            <p className={styles.getDirection}>
              <Link
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(COMPANY_ADDRESS)}`}
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
              priority
            />
            <Image src={GaragePhoto} alt="Photo of the PDR Studio garage" width={300} height={400} className={styles.garagePhoto} />
          </div>

          <div aria-live="polite">
            {errorMessage ? (
              <p>{errorMessage}</p>
            ) : safeReviews.length === 0 ? (
              <p>Aucun avis publié pour le moment.</p>
            ) : (
              <ul className={styles.feedbackList}>
                {safeReviews.map((reviewItem) => {
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
                    ? new Date(reviewItem.date).toLocaleDateString("fr-FR")
                    : null;
                  return (
                    <li key={reviewItem.id} className={styles.reviewItem}>
                      <div
                        className={styles.reviewStars}
                        role="img"
                        aria-label={`Note ${safeRating} sur 5`}
                      >
                        {stars}
                      </div>
                      <div className={styles.reviewHeader}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initials}
                        </span>
                        <strong className={styles.clientName}>
                          {normalizeName(reviewItem.clientName)}
                        </strong>
                      </div>
                      <div className={styles.reviewMeta}>
                        {t("publishedOn")} {formattedDate ?? "—"}
                      </div>
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
                                : t("adminReply.byUnknown")}{" "}
                              ·
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
          </div>

          <ReviewCreateForm />
        </div>
        <EstimateRequestForm />
      </div>
    </div>
  );
}
