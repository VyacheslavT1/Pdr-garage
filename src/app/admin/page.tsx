// src/app/admin/page.tsx

import { headers } from "next/headers";
import AdminHomeClient from "./AdminHomeClient";

// Подставь свои эндпоинты:
const REQUESTS_COUNT_ENDPOINT = "/api/requests/count?status=Non%20trait%C3%A9";
const REVIEWS_COUNT_ENDPOINT =
  "/api/reviews/count?status=%D0%A7%D0%B5%D1%80%D0%BD%D0%BE%D0%B2%D0%B8%D0%BA"; // новые отзывы

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const headerBag = await headers();
  const protocol = headerBag.get("x-forwarded-proto") ?? "http";
  const host = headerBag.get("host");
  const baseUrl = host ? `${protocol}://${host}` : "";
  const cookie = headerBag.get("cookie") ?? "";

  const makeUrl = (path: string) => (baseUrl ? `${baseUrl}${path}` : path);

  let newRequestsCount = 0;
  let newReviewsCount = 0;
  let errorMessage: string | null = null;

  try {
    const [requestsResponse, reviewsResponse] = await Promise.all([
      fetch(makeUrl(REQUESTS_COUNT_ENDPOINT), {
        headers: { cookie },
        cache: "no-store",
      }),
      fetch(makeUrl(REVIEWS_COUNT_ENDPOINT), {
        headers: { cookie },
        cache: "no-store",
      }),
    ]);

    if (!requestsResponse.ok) {
      throw new Error(`Requests count HTTP ${requestsResponse.status}`);
    }
    if (!reviewsResponse.ok) {
      throw new Error(`Reviews count HTTP ${reviewsResponse.status}`);
    }

    const requestsJson: { count: number } = await requestsResponse.json();
    const reviewsJson: { count: number } = await reviewsResponse.json();

    newRequestsCount = Number(requestsJson?.count ?? 0);
    newReviewsCount = Number(reviewsJson?.count ?? 0);
  } catch (caughtError: unknown) {
    errorMessage =
      caughtError instanceof Error ? caughtError.message : "Unknown error";
  }

  return (
    <AdminHomeClient
      newRequestsCount={newRequestsCount}
      newReviewsCount={newReviewsCount}
      errorMessage={errorMessage}
    />
  );
}
