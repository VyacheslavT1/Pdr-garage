"use client";

import AdminNav from "@/shared/ui/admin-nav/AdminNav";
import Link from "next/link";
import styles from "./AdminHome.module.scss";
import { Empty, Alert } from "antd";

type AdminHomeClientProps = {
  newRequestsCount: number;
  newReviewsCount: number;
  errorMessage: string | null;
};

export default function AdminHomeClient({
  newRequestsCount,
  newReviewsCount,
  errorMessage,
}: AdminHomeClientProps) {
  const noNewsText = "Pas de nouvelle";

  function formatReviewsLine(n: number): string | null {
    if (n <= 0) return null;
    return `Vous avez ${n} ${n === 1 ? "nouvel avis" : "nouveaux avis"}`;
  }

  function formatRequestsLine(n: number): string | null {
    if (n <= 0) return null;
    return `Vous avez ${n} ${
      n === 1 ? "nouvelle demande" : "nouvelles demandes"
    }`;
  }

  const reviewsLine = formatReviewsLine(newReviewsCount);
  const requestsLine = formatRequestsLine(newRequestsCount);

  return (
    <div className={styles.pageRoot}>
      <AdminNav />
      <h1 className={styles.title}>Panneau d’administration</h1>

      <div className={styles.notifications}>
        {errorMessage ? (
          <Alert
            type="error"
            message="Impossible de charger les données"
            description={errorMessage}
            showIcon
          />
        ) : (
          <Empty
            description={
              reviewsLine || requestsLine ? (
                <div className={styles.noticeList}>
                  {reviewsLine && (
                    <Link href="/admin/reviews" className={styles.noticeLink}>
                      <span className={styles.noticeStar}>*</span>
                      <p>{reviewsLine}</p>
                    </Link>
                  )}
                  {requestsLine && (
                    <Link href="/admin/requests" className={styles.noticeLink}>
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
