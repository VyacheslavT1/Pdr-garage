// src/modules/requests/lib/storage.ts
import type { RequestAttachment } from "../model/types";
import { supabaseServer } from "@/shared/api/supabase/server";

const ATTACHMENTS_BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET || "requests";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h

function ensureArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items : [];
}

export async function populateAttachmentUrls(
  attachments: RequestAttachment[]
): Promise<RequestAttachment[]> {
  const bucket = supabaseServer.storage.from(ATTACHMENTS_BUCKET);

  const enriched = await Promise.all(
    ensureArray(attachments).map(async (att) => {
      if (att.storagePath) {
        const { data, error } = await bucket.createSignedUrl(
          att.storagePath,
          SIGNED_URL_TTL_SECONDS
        );
        return {
          ...att,
          publicUrl: error ? null : data?.signedUrl ?? null,
        };
      }

      // legacy inline data
      return { ...att, publicUrl: att.dataUrl ?? null };
    })
  );

  return enriched;
}

export async function uploadAttachmentsForRequest(
  requestId: string,
  attachments: RequestAttachment[]
): Promise<RequestAttachment[]> {
  const safeAttachments = ensureArray(attachments);

  if (process.env.DISABLE_STORAGE_UPLOADS === "true") {
    return safeAttachments;
  }

  if (safeAttachments.length === 0) {
    return [];
  }

  const bucket = supabaseServer.storage.from(ATTACHMENTS_BUCKET);

  const results = await Promise.all(
    safeAttachments.map(async (att) => {
      if (!att?.dataUrl) {
        return att;
      }

      const parsed = parseDataUrl(att.dataUrl);
      if (!parsed) {
        return {
          ...att,
          dataUrl: null,
        };
      }

      const safeName = sanitizeFileName(att.name || "file");
      const storagePath = `${ATTACHMENTS_BUCKET}/${requestId}/${att.id}_${safeName}`;
      const contentType = att.type || parsed.mimeType;
      const size = Number.isFinite(att.size) && att.size > 0 ? att.size : parsed.buffer.byteLength;

      const { error: uploadError } = await bucket.upload(storagePath, parsed.buffer, {
        contentType,
        upsert: true,
      });

      if (uploadError) {
        return {
          ...att,
          dataUrl: null,
          storagePath: null,
        };
      }

      const publicUrl = bucket.getPublicUrl(storagePath).data?.publicUrl ?? null;

      return {
        ...att,
        dataUrl: publicUrl,
        storagePath,
        size,
      };
    })
  );

  return results;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseDataUrl(value: string): { mimeType: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(value);
  if (!match) return null;
  const [, mimeType, base64] = match;
  if (!base64) return null;
  try {
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) return null;
    return { mimeType, buffer };
  } catch {
    return null;
  }
}
