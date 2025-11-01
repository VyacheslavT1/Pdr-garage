// src/modules/requests/model/validation.ts
import type { RequestItem } from "./../model/types";

export type CreateRequestPayload = Pick<
  RequestItem,
  "clientName" | "phone" | "email" | "comment" | "gender"
>;

export type ValidationErrors = Record<string, string>;

export function normalizePhone(raw: string): string {
  return (raw || "").toString().replace(/[^\d+]/g, "");
}

export function normalizeAndValidateCreate(body: unknown): {
  payload: CreateRequestPayload;
  errors: ValidationErrors;
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const incoming = {
    clientName: (b.clientName ?? "").toString().trim(),
    phone: (b.phone ?? "").toString().trim(),
    email: (b.email ?? "").toString().trim(),
    comment: typeof b.comment === "string" ? b.comment.trim() : null,
    gender:
      typeof b.gender === "string" ? b.gender.trim().toLowerCase() : undefined,
  } as CreateRequestPayload & { gender?: string };

  const errors: ValidationErrors = {};

  // clientName
  if (!incoming.clientName) {
    errors.clientName = "Le nom est obligatoire";
  } else if (incoming.clientName.length > 120) {
    errors.clientName = "Le nom est trop long";
  }

  // phone
  if (!incoming.phone) {
    errors.phone = "Le numéro de téléphone est obligatoire";
  } else {
    const normalized = normalizePhone(incoming.phone);
    if (!/^\+?\d{6,20}$/.test(normalized)) {
      errors.phone = "Format du numéro de téléphone invalide";
    } else {
      incoming.phone = normalized;
    }
  }

  // comment
  if (incoming.comment && incoming.comment.length > 1000) {
    errors.comment = "Le commentaire est trop long";
  }

  // gender (optional)
  if (incoming.gender !== undefined) {
    if (incoming.gender !== "male" && incoming.gender !== "female") {
      errors.gender = "Valeur de genre non autorisée";
      delete (incoming as unknown as { gender?: string }).gender;
  }
}

  const payload: CreateRequestPayload = {
    clientName: incoming.clientName,
    phone: incoming.phone,
    email: incoming.email,
    comment: incoming.comment,
    gender: (incoming as { gender?: "male" | "female" }).gender,
  };

  return { payload, errors };
}
