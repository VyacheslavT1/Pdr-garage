// src/modules/reviews/lib/mappers.ts
import type { ReviewItem } from "../model/types";

type ReviewRow = {
  id: string;
  client_name: string;
  rating?: number | null;
  status: ReviewItem["status"];
  comment?: string | null;
  date?: string | null;
  updated_at: string;
  admin_reply?: string | null;
  admin_reply_date?: string | null;
  admin_reply_author?: string | null;
};

export function mapRowToReviewItem(row: ReviewRow): ReviewItem {
  return {
    id: row.id,
    clientName: row.client_name,
    rating: row.rating ?? null,
    status: row.status,
    comment: row.comment ?? null,
    date: row.date ?? null,
    updatedAt: row.updated_at,
    adminReply: row.admin_reply ?? null,
    adminReplyDate: row.admin_reply_date ?? null,
    adminReplyAuthor: row.admin_reply_author ?? null,
  };
}
