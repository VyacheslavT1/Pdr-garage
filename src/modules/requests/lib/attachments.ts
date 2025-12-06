// src/modules/requests/lib/attachments.ts
import type { RequestAttachment } from "../model/types";

export function normalizeIncomingAttachments(
  raw: unknown
): RequestAttachment[] {
  const incoming: unknown[] = Array.isArray(raw) ? raw : [];
  return incoming.slice(0, 10).map((it: unknown) => {
    const x = it as Record<string, unknown>;
    const hasValidDataUrl =
      typeof x.dataUrl === "string" && x.dataUrl.startsWith("data:image/");

    return {
      id: typeof x.id === "string" ? x.id : `att_${crypto.randomUUID()}`,
      name: typeof x.name === "string" ? x.name : "file",
      type: typeof x.type === "string" ? x.type : "application/octet-stream",
      size: Number.isFinite(x.size as number) ? Number(x.size) : 0,
      storagePath: typeof x.storagePath === "string" ? x.storagePath : null,
      publicUrl:
        typeof x.publicUrl === "string" ? (x.publicUrl as string) : null,
      dataUrl: hasValidDataUrl ? (x.dataUrl as string) : null, // legacy
    } as RequestAttachment;
  });
}
