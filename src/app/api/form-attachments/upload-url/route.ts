// src/app/api/form-attachments/upload-url/route.ts

"use server";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_ATTACHMENTS_SIZE_BYTES = 10 * 1024 * 1024; //10 MB
const MAX_FILES_PER_REQUEST = 6;

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ATTACHMENTS_BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET || "form-attachments";

type IncomingFileMeta = {
  name: string;
  type: string;
  size: number;
};

type UploadDescriptor = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploadUrl: string | null;
  uploadToken: string | null;
};

type UploadUrlResponse =
  | {
      ok: true;
      uploads: UploadDescriptor[];
    }
  | {
      ok: false;
      error: string;
    };

export async function POST(incomingRequest: Request): Promise<Response> {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json<UploadUrlResponse>(
        { ok: false, error: "supabaseNotConfigured" },
        { status: 500 }
      );
    }

    const supabaseServerForUploads = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // читаем json из запроса
    const body = await incomingRequest.json().catch(() => null);
    if (!body || !Array.isArray(body.files)) {
      return NextResponse.json<UploadUrlResponse>(
        { ok: false, error: "invalidPayload" },
        { status: 400 }
      );
    }

    // если вызывается этот URL, то предполагается что файлы точно существуют
    const rawFiles = body.files as IncomingFileMeta[];

    if (rawFiles.length === 0) {
      return NextResponse.json<UploadUrlResponse>(
        { ok: false, error: "noFilesProvided" },
        { status: 400 }
      );
    }

    const normalizedFiles = rawFiles.slice(0, MAX_FILES_PER_REQUEST);
    const uploads: UploadDescriptor[] = [];

    for (const currentFile of normalizedFiles) {
      const originalName = String(currentFile.name ?? "").trim();
      const mimeType = String(currentFile.type ?? "").trim();
      const fileSize = Number(currentFile.size ?? 0);

      if (!originalName || !mimeType || !Number.isFinite(fileSize)) {
        continue;
      }

      const isImage = mimeType.startsWith("image/");
      const isPdf = mimeType === "application/pdf";

      if (!isImage && !isPdf) {
        continue;
      }

      if (fileSize <= 0 || fileSize > MAX_ATTACHMENTS_SIZE_BYTES) {
        continue;
      }

      const safeBaseName =
        originalName.replace(/[^a-zA-Z0-9._]/g, "_") || "attachment";

      const attachmentId = `att_${crypto.randomUUID()}`;
      const storagePath = `form-attachments/${attachmentId}_${safeBaseName}`;

      const signedUrlResult = await supabaseServerForUploads.storage
        .from(SUPABASE_ATTACHMENTS_BUCKET)
        .createSignedUploadUrl(storagePath);
      if (signedUrlResult.error || !signedUrlResult.data) {
        continue;
      }

      uploads.push({
        id: attachmentId,
        fileName: originalName,
        mimeType,
        size: fileSize,
        storagePath,
        uploadUrl: signedUrlResult.data.signedUrl,
        uploadToken: signedUrlResult.data.token ?? null,
      });
    }
    if (uploads.length === 0) {
      return NextResponse.json<UploadUrlResponse>(
        { ok: false, error: "noValidFiles" },
        { status: 400 }
      );
    }
    return NextResponse.json<UploadUrlResponse>(
      { ok: true, uploads },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<UploadUrlResponse>(
      { ok: false, error: "unexpectedError" },
      { status: 500 }
    );
  }
}
