// src/modules/requests/lib/mappers.ts
import type { RequestItem, RequestAttachment } from "../model/types";

type RequestRow = {
  id: string;
  created_at: string;
  client_name: string;
  gender?: "male" | "female" | null;
  phone: string;
  email: string;
  comment?: string | null;
  status: RequestItem["status"];
  attachments?: unknown;
};

export function mapRowToRequestItem(row: RequestRow): RequestItem {
  function sanitizeAttachments(raw: unknown): RequestAttachment[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((it: unknown) => {
      const x = it as Record<string, unknown>;
      return {
        id: typeof x.id === "string" ? x.id : "",
        name: typeof x.name === "string" ? x.name : "",
        type: typeof x.type === "string" ? x.type : "application/octet-stream",
        size: Number.isFinite(x.size as number) ? Number(x.size) : 0,
        dataUrl:
          typeof x.dataUrl === "string"
            ? (x.dataUrl as string)
            : null,
      } as RequestAttachment;
    });
  }
  return {
    id: row.id,
    createdAt: row.created_at,
    clientName: row.client_name,
    gender: row.gender ?? undefined,
    phone: row.phone,
    email: row.email,
    comment: row.comment ?? null,
    status: row.status,
    attachments: sanitizeAttachments(row.attachments),
  };
}
