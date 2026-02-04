import { unstable_cache } from "next/cache";
import { supabaseServer } from "@/shared/api/supabase/server";
import { mapRowToReviewItem } from "@/modules/reviews/lib/mappers";
import ContactSectionClient from "./local";
import type { PublishedReview } from "./helpers";

const REVIEWS_LIMIT = 10;
const getPublishedReviews = unstable_cache(
  async (): Promise<PublishedReview[]> => {
    const { data, error } = await supabaseServer
      .from("reviews")
      .select(
        "id, client_name, rating, comment, date, admin_reply, admin_reply_author, admin_reply_date, status, updated_at"
      )
      .eq("status", "Publié")
      .order("date", { ascending: false })
      .limit(REVIEWS_LIMIT);

    if (error) {
      throw new Error(error.message);
    }

    const fullItems = (data || []).map(mapRowToReviewItem);
    return fullItems.map((it) => ({
      id: it.id,
      clientName: it.clientName,
      rating: it.rating ?? null,
      comment: it.comment ?? null,
      date: it.date ?? null,
      adminReply: it.adminReply ?? null,
      adminReplyAuthor: it.adminReplyAuthor ?? null,
      adminReplyDate: it.adminReplyDate ?? null,
    }));
  },
  ["contact-section-reviews"],
  { revalidate: 60 }
);

export default async function ContactSection() {
  let publishedReviews: PublishedReview[] = [];
  let reviewsErrorMessage = "";

  try {
    publishedReviews = await getPublishedReviews();
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
