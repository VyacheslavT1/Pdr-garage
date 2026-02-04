// src/modules/requests/feature/estimate-request/model/submit.ts

"use server";

import { supabaseServer } from "@/shared/api/supabase/server";
import type { RequestItem, RequestAttachment } from "@/modules/requests/model/types";
import { uploadAttachmentsForRequest } from "@/modules/requests/lib/storage";

export type SubmitEstimateResult = {
  ok: boolean;
  fieldErrors?: {
    gender?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    message?: string;
    attachment?: string;
    consent?: string;
  };
  formError?: string;
};

const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

type AttachmentsMetadataItem = {
  id: string;
  fileName?: string;
  mimeType?: string;
  name?: string;
  type?: string;
  size: number;
  storagePath: string;
  uploadUrl?: string | null;
  uploadToken?: string | null;
};

function isValidName(value: string) {
  return /^[A-Za-zА-Яа-я]+$/.test(value);
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+()\- ]+/g, "");
}

function isValidFrenchPhone(phone: string): boolean {
  const frenchRegex = /^0[1-9](\s?\d{2}){4}$/;
  const internationalFrenchRegex = /^\+33\s?[1-9](\s?\d{2}){4}$/;

  return frenchRegex.test(phone) || internationalFrenchRegex.test(phone);
}

function isAllowedAttachmentType(type: string): boolean {
  return type.startsWith("image/") || type === "application/pdf";
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeType = file.type || "application/octet-stream";
  return `data:${safeType};base64,${buffer.toString("base64")}`;
}

export async function submitEstimateRequest(
  formData: FormData
): Promise<SubmitEstimateResult> {
  try {
    const gender = String(formData.get("gender") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const phoneRaw = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const company = String(formData.get("company") ?? "").trim();
    const consentAccepted = formData.has("consentToContact");

    const attachmentEntries = formData.getAll("attachment");
    const attachmentFiles = attachmentEntries.filter(
      (entry): entry is File => entry instanceof File
    );

    const attachmentsMetadataRaw = formData.get("attachmentsMetadata");
    const attachmentsPayload = [] as Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      storagePath?: string | null;
      dataUrl?: string | null;
    }>;

    if (
      typeof attachmentsMetadataRaw === "string" &&
      attachmentsMetadataRaw.trim() !== ""
    ) {
      try {
        const parsed = JSON.parse(
          attachmentsMetadataRaw
        ) as AttachmentsMetadataItem[];
        if (Array.isArray(parsed)) {
          for (const currentItem of parsed) {
            if (
              !currentItem ||
              !currentItem.id ||
              !(currentItem.fileName || currentItem.name) ||
              !(currentItem.mimeType || currentItem.type) ||
              !currentItem.size ||
              !currentItem.storagePath
            ) {
              continue;
            }
            attachmentsPayload.push({
              id: currentItem.id,
              name: currentItem.fileName ?? currentItem.name!,
              type: currentItem.mimeType ?? currentItem.type!,
              size: currentItem.size,
              storagePath: currentItem.storagePath,
            });
          }
        }
      } catch {}
    }

    const fieldErrors: SubmitEstimateResult["fieldErrors"] = {};

    if (attachmentsPayload.length === 0 && attachmentFiles.length > 0) {
      for (const file of attachmentFiles) {
        if (
          typeof file.name !== "string" ||
          file.name.trim().length === 0 ||
          typeof file.size !== "number" ||
          file.size <= 0
        ) {
          continue;
        }

        if (!isAllowedAttachmentType(file.type || "")) {
          fieldErrors.attachment = "validationAttachmentType";
          break;
        }

        if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
          fieldErrors.attachment = "validationAttachmentSize";
          break;
        }

        const dataUrl = await fileToDataUrl(file);
        attachmentsPayload.push({
          id: `att_${crypto.randomUUID()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        });
      }
    }

    if (!["male", "female"].includes(gender)) {
      fieldErrors.gender = "validationGenderInvalid";
    }

    if (!firstName) {
      fieldErrors.firstName = "validationFirstNameRequired";
    } else if (firstName.length > MAX_NAME_LENGTH) {
      fieldErrors.firstName = "validationFirstNameMax";
    } else if (!isValidName(firstName)) {
      fieldErrors.firstName = "validationFirstNameSymbols";
    }

    if (!lastName) {
      fieldErrors.lastName = "validationLastNameRequired";
    } else if (lastName.length > MAX_NAME_LENGTH) {
      fieldErrors.lastName = "validationLastNameMax";
    } else if (!isValidName(lastName)) {
      fieldErrors.lastName = "validationLastNameSymbols";
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      fieldErrors.phone = "validationPhoneRequired";
    } else if (isValidFrenchPhone(phone)) {
    } else if (phone.replace(/\D/g, "").length < 8 || phone.length > 20) {
      fieldErrors.phone = "validationPhoneInvalid";
    }

    if (!email) {
      fieldErrors.email = "validationEmailRequired";
    } else if (!isValidEmail(email)) {
      fieldErrors.email = "validationEmailInvalid";
    }

    if (!message) {
      fieldErrors.message = "validationMessageRequired";
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      fieldErrors.message = "validationMessageMax";
    }

    if (!consentAccepted) {
      fieldErrors.consent = "validationConsentRequired";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, fieldErrors };
    }

    try {
      if (company) {
        return { ok: true };
      }

      const clientFullName = `${firstName} ${lastName}`.trim();
      const normalizedGender: "male" | "female" | undefined =
        gender === "male" || gender === "female"
          ? (gender as "male" | "female")
          : undefined;

      const requestId = `rq_${crypto.randomUUID()}`;
      const attachments: RequestAttachment[] = attachmentsPayload.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size,
        storagePath: item.storagePath ?? null,
        dataUrl: item.dataUrl ?? null,
      }));

      const uploadedAttachments = await uploadAttachmentsForRequest(
        requestId,
        attachments
      );

      const storagePaths =
        uploadedAttachments
          .map((att) => att.storagePath)
          .filter((p): p is string => typeof p === "string" && p.length > 0) ??
        [];

      const newRequestItem: RequestItem = {
        id: requestId,
        createdAt: new Date().toISOString(),
        clientName: clientFullName,
        phone: phone,
        email: email,
        comment: message || undefined,
        status: "Non traité",
        attachments: uploadedAttachments,
        gender: normalizedGender,
        storagePaths,
      };

      const { error: insertError } = await supabaseServer
        .from("requests")
        .insert([
          {
            id: newRequestItem.id,
            created_at: newRequestItem.createdAt,
            client_name: newRequestItem.clientName,
            gender: newRequestItem.gender ?? null,
            phone: newRequestItem.phone,
            email: newRequestItem.email,
            comment: newRequestItem.comment,
            status: newRequestItem.status,
            attachments: newRequestItem.attachments ?? [],
          },
        ]);

      if (insertError) {
        return { ok: false, formError: "formSubmitFailed" };
      }
    } catch {
      return { ok: false, formError: "formSubmitFailed" };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      formError: "formSubmitFailed",
    };
  }
}
