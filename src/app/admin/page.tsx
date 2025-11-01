// src/app/admin/page.tsx

"use client";

import AdminNav from "@/shared/ui/admin-nav/AdminNav";
import Link from "next/link";
import styles from "./AdminHome.module.scss";
import { Empty, Spin, Alert } from "antd";
import { useEffect, useState } from "react";

// Подставь свои эндпоинты:
const REQUESTS_COUNT_ENDPOINT = "/api/requests/count?status=Non%20trait%C3%A9";
const REVIEWS_COUNT_ENDPOINT =
  "/api/reviews/count?status=%D0%A7%D0%B5%D1%80%D0%BD%D0%BE%D0%B2%D0%B8%D0%BA"; // новые отзывы

export default function AdminHomePage() {
  const [newRequestsCount, setNewRequestsCount] = useState<number>(0);
  const [newReviewsCount, setNewReviewsCount] = useState<number>(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(true);
  const [loadingErrorMessage, setLoadingErrorMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadCounts() {
      setIsLoadingCounts(true);
      setLoadingErrorMessage(null);

      try {
        const [requestsResponse, reviewsResponse] = await Promise.all([
          fetch(REQUESTS_COUNT_ENDPOINT, { cache: "no-store" }),
          fetch(REVIEWS_COUNT_ENDPOINT, { cache: "no-store" }),
        ]);

        if (!requestsResponse.ok) {
          throw new Error(`Requests count HTTP ${requestsResponse.status}`);
        }
        if (!reviewsResponse.ok) {
          throw new Error(`Reviews count HTTP ${reviewsResponse.status}`);
        }

        const requestsJson: { count: number } = await requestsResponse.json();
        const reviewsJson: { count: number } = await reviewsResponse.json();

        if (isCancelled) return;

        setNewRequestsCount(Number(requestsJson?.count ?? 0));
        setNewReviewsCount(Number(reviewsJson?.count ?? 0));
      } catch (caughtError: unknown) {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        if (!isCancelled) {
          setLoadingErrorMessage(errorMessage);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCounts(false);
        }
      }
    }

    loadCounts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const noNewsText = "Pas de nouvelle";
  function formatReviewsLine(n: number): string | null {
    if (n <= 0) return null;
    return `Vous avez ${n} ${n === 1 ? "nouvel avis" : "nouveaux avis"}`;
  }
  function formatRequestsLine(n: number): string | null {
    if (n <= 0) return null;
    return `Vous avez ${n} ${n === 1 ? "nouvelle demande" : "nouvelles demandes"}`;
  }
  const reviewsLine = formatReviewsLine(newReviewsCount);
  const requestsLine = formatRequestsLine(newRequestsCount);

  return (
    <div className={styles.pageRoot}>
      <AdminNav />
      <h1 className={styles.title}>Panneau d’administration</h1>

      <div className={styles.notifications}>
        {isLoadingCounts ? (
          <div className={styles.loadingRow} aria-busy="true">
            <Spin tip="Chargement...">
              <div className={styles.loadingPlaceholder} />
            </Spin>
          </div>
        ) : loadingErrorMessage ? (
          <Alert
            type="error"
            message="Impossible de charger les données"
            description={loadingErrorMessage}
            showIcon
          />
        ) : (
          <Empty
            description={
              reviewsLine || requestsLine ? (
                <div className={styles.noticeList}>
                  {reviewsLine && (
                    <Link
                      href="/admin/reviews"
                      className={styles.noticeLink}
                    >
                      <span className={styles.noticeStar}>*</span>
                      <p>{reviewsLine}</p>
                    </Link>
                  )}
                  {requestsLine && (
                    <Link
                      href="/admin/requests"
                      className={styles.noticeLink}
                    >
                      <span className={styles.noticeStar}>*</span>
                      <p>{requestsLine}</p>
                    </Link>
                  )}
                </div>
              ) : (
                noNewsText
              )
            }
          />
        )}
      </div>
    </div>
  );
}
