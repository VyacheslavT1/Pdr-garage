// src/modules/requests/lib/storage.ts
import { supabaseServer } from "@/shared/api/supabase/server";
import type { RequestAttachment } from "../model/types";

export async function uploadAttachmentsForRequest(
  requestId: string,
  attachments: RequestAttachment[]
): Promise<RequestAttachment[]> {
  const isStorageUploadsDisabled = process.env.DISABLE_STORAGE_UPLOADS === "true";
  if (isStorageUploadsDisabled) return attachments || [];

  const storageBucketName = "requests";

  async function saveImageDataUrlToStorage(args: {
    requestId: string;
    attachmentId: string;
    name: string;
    type: string;
    dataUrl: string; // "data:image/png;base64,..."
  }): Promise<{ publicUrl: string; bytes: number }> {
    const commaIndex = args.dataUrl.indexOf(",");
    if (commaIndex < 0) throw new Error("Invalid dataUrl format");
    const base64Part = args.dataUrl.slice(commaIndex + 1);
    const buffer = Buffer.from(base64Part, "base64");

    const safeName = args.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const objectPath = `requests/${args.requestId}/${args.attachmentId}_${safeName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(storageBucketName)
      .upload(objectPath, buffer, {
        contentType: args.type || "application/octet-stream",
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseServer.storage
      .from(storageBucketName)
      .getPublicUrl(objectPath);
    return { publicUrl: publicData.publicUrl, bytes: buffer.byteLength };
  }

  const uploaded = await Promise.all(
    (attachments || []).map(async (att) => {
      if (att.dataUrl && typeof att.dataUrl === "string") {
        try {
          const { publicUrl, bytes } = await saveImageDataUrlToStorage({
            requestId,
            attachmentId: att.id,
            name: att.name,
            type: att.type,
            dataUrl: att.dataUrl,
          });
          return {
            ...att,
            size: Number.isFinite(att.size) ? att.size : bytes,
            dataUrl: publicUrl,
          } as RequestAttachment;
        } catch {
          return { ...att, dataUrl: null } as RequestAttachment;
        }
      }
      return att;
    })
  );

  return uploaded;
}

