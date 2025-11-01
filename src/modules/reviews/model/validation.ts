// src/modules/reviews/model/validation.ts
import type { ReviewStatus } from "./types";

// -------- Public create (reviews/public POST) --------
export type PublicCreatePayload = {
  clientName: string;
  rating: number | null;
  comment: string | null;
};

export function normalizeAndValidatePublicCreate(body: unknown): {
  payload: PublicCreatePayload;
  errors: Record<string, string>;
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const payload: PublicCreatePayload = {
    clientName: (b.clientName ?? "").toString().trim(),
    rating:
      b.rating === null || b.rating === ""
        ? null
        : Number(b.rating as number),
    comment:
      typeof b.comment === "string" && b.comment.trim().length > 0
        ? b.comment.trim()
        : null,
  };

  const errors: Record<string, string> = {};

  if (!payload.clientName) errors.clientName = "Имя обязательно";
  else if (payload.clientName.length > 120)
    errors.clientName = "Имя слишком длинное";

  if (payload.rating !== null) {
    if (
      !Number.isFinite(payload.rating) ||
      payload.rating < 1 ||
      payload.rating > 5
    ) {
      errors.rating = "Оценка должна быть числом 1–5 или null";
    }
  }

  if (payload.comment !== null && payload.comment.length > 2000) {
    errors.comment = "Текст отзыва слишком длинный";
  }

  return { payload, errors };
}

// -------- Admin update (reviews PUT) --------
export type AdminUpdateFields = {
  clientName?: string;
  rating?: number | null;
  status?: ReviewStatus;
  date?: string | null;
  adminReply?: string | null;
  adminReplyAuthor?: string | null;
};

export function normalizeAndValidateAdminUpdate(body: unknown): {
  update: AdminUpdateFields;
  errors: Record<string, string>;
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const update: AdminUpdateFields = {
    clientName: typeof b.clientName === "string" ? b.clientName.trim() : undefined,
    rating:
      b.rating === null ? null : typeof b.rating === "number" ? (b.rating as number) : undefined,
    status: b.status as ReviewStatus | undefined,
    date: b.date === null ? null : typeof b.date === "string" ? (b.date as string) : undefined,
    adminReply:
      b.adminReply === null
        ? null
        : typeof b.adminReply === "string"
        ? (b.adminReply as string).trim()
        : undefined,
    adminReplyAuthor:
      b.adminReplyAuthor === null
        ? null
        : typeof b.adminReplyAuthor === "string"
        ? (b.adminReplyAuthor as string).trim()
        : undefined,
  };

  const errors: Record<string, string> = {};

  if (update.clientName !== undefined) {
    if (update.clientName.length === 0)
      errors.clientName = "Le nom est obligatoire";
    if (update.clientName.length > 120)
      errors.clientName = "Le nom est trop long";
  }

  if (update.rating !== undefined) {
    const value = update.rating;
    const isNull = value === null;
    const isValidNumber =
      Number.isFinite(value as number) &&
      (value as number) >= 1 &&
      (value as number) <= 5;
    if (!(isNull || isValidNumber)) {
      errors.rating = "La note doit être comprise entre 1 et 5 ou null";
    }
  }

  if (update.status !== undefined) {
    if (!(["Brouillon", "Publié", "Masqué"] as ReviewStatus[]).includes(update.status)) {
      errors.status = "Statut non autorisé";
    }
  }

  if (update.date !== undefined) {
    if (update.date !== null && Number.isNaN(Date.parse(update.date))) {
      errors.date = "Format de date invalide (ISO requis ou null)";
    }
  }

  if (update.adminReply !== undefined) {
    if (update.adminReply !== null && update.adminReply.length > 4000) {
      errors.adminReply = "La réponse de l’administrateur est trop longue";
    }
  }

  if (update.adminReplyAuthor !== undefined) {
    if (update.adminReplyAuthor !== null && update.adminReplyAuthor.length > 120) {
      errors.adminReplyAuthor = "Le nom de l’auteur est trop long";
    }
  }

  return { update, errors };
}

// -------- Admin create (reviews POST) --------
export type AdminCreatePayload = {
  clientName: string;
  rating?: number | null;
  status: ReviewStatus;
  date?: string | null;
};

export function normalizeAndValidateAdminCreate(body: unknown): {
  payload: AdminCreatePayload;
  errors: Record<string, string>;
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const payload: AdminCreatePayload = {
    clientName: (b.clientName ?? "").toString().trim(),
    rating:
      b.rating === null
        ? null
        : typeof b.rating === "number"
        ? (b.rating as number)
        : undefined,
    status: b.status as ReviewStatus,
    date:
      b.date === null
        ? null
        : typeof b.date === "string"
        ? (b.date as string)
        : undefined,
  };

  const errors: Record<string, string> = {};

  if (!payload.clientName) errors.clientName = "Le nom est obligatoire";
  else if (payload.clientName.length > 120)
    errors.clientName = "Le nom est trop long";

  if (payload.rating !== undefined) {
    const value = payload.rating;
    const isNull = value === null;
    const isValidNumber =
      Number.isFinite(value as number) &&
      (value as number) >= 1 &&
      (value as number) <= 5;
    if (!(isNull || isValidNumber)) {
      errors.rating =
        "La note doit être comprise entre 1 et 5 ou null";
    }
  }

  if (!(["Brouillon", "Publié", "Masqué"] as ReviewStatus[]).includes(payload.status)) {
    errors.status = "Statut non autorisé";
  }

  if (payload.date !== undefined) {
    if (payload.date !== null && Number.isNaN(Date.parse(payload.date))) {
      errors.date = "Format de date invalide (ISO requis ou null)";
    }
  }

  return { payload, errors };
}
