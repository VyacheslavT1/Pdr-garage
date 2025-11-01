// src/modules/reviews/model/types.ts

export type ReviewStatus = "Brouillon" | "Publié" | "Masqué";

export type ReviewItem = {
  id: string;
  clientName: string;
  rating?: number | null;
  status: ReviewStatus;
  comment?: string | null;
  date?: string | null;
  updatedAt: string;
  adminReply?: string | null;
  adminReplyDate?: string | null;
  adminReplyAuthor?: string | null;
};

