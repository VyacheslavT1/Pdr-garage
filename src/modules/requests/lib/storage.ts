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
  _requestId: string,
  attachments: RequestAttachment[]
): Promise<RequestAttachment[]> {
  return attachments ?? [];
}
