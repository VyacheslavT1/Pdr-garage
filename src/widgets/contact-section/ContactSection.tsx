import ContactSectionClient from "./local";
import type { PublishedReview } from "./helpers";

const REVIEWS_ENDPOINT = "/api/reviews/public?limit=10";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "http://localhost:3000";

export default async function ContactSection() {
  let publishedReviews: PublishedReview[] = [];
  let reviewsErrorMessage = "";

  try {
    const url = `${SITE_URL.replace(/\/$/, "")}${REVIEWS_ENDPOINT}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as { items?: PublishedReview[] };
    publishedReviews = Array.isArray(json.items) ? json.items : [];
  } catch {
    reviewsErrorMessage = "Impossible de charger les avis publiés.";
  }

  return (
    <ContactSectionClient
      publishedReviews={publishedReviews}
      reviewsErrorMessage={reviewsErrorMessage}
    />
  );
}
