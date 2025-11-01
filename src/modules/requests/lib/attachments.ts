// src/modules/requests/lib/attachments.ts
import type { RequestAttachment } from "../model/types";

export function normalizeIncomingAttachments(raw: unknown): RequestAttachment[] {
  const incoming: unknown[] = Array.isArray(raw) ? raw : [];
  return incoming
    .slice(0, 10)
    .map((it: unknown) => {
      const x = it as Record<string, unknown>;
      return {
        id: typeof x.id === "string" ? x.id : `att_${crypto.randomUUID()}`,
        name: typeof x.name === "string" ? x.name : "file",
        type: typeof x.type === "string" ? x.type : "application/octet-stream",
        size: Number.isFinite(x.size as number) ? Number(x.size) : 0,
        dataUrl:
          typeof x.dataUrl === "string" && x.dataUrl.startsWith("data:image/")
            ? x.dataUrl
            : null,
      } as RequestAttachment;
    })
    .filter((att) =>
      att.dataUrl === null ||
      (typeof att.dataUrl === "string" && att.dataUrl.startsWith("data:image/"))
    );
}
