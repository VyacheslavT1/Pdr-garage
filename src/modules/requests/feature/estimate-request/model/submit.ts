"use server";

import { headers } from "next/headers";

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

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ATTACHMENT_TYPES = ["application/pdf"]; // plus any image/*
const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 2000;

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

    const attachmentEntry = formData.get("attachment");
    const attachmentFile =
      attachmentEntry instanceof File ? (attachmentEntry as File) : null;
    const hasRealAttachment =
      !!attachmentFile && !!attachmentFile.name && attachmentFile.size > 0;

    const attachmentsFromForm = formData.getAll("attachment");
    const imageFiles = attachmentsFromForm.filter(
      (entry) => entry instanceof File
    ) as File[];

    const maxPreviewImages = 6;
    const maxPreviewBytesPerImage = 1_500_000;

    const attachmentsPayload = [] as Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      // dataUrl: string | null;
    }>;
    for (
      let index = 0;
      index < imageFiles.length && attachmentsPayload.length < maxPreviewImages;
      index += 1
    ) {
      const currentFile = imageFiles[index];
      if (!currentFile.type.startsWith("image/")) continue;

      // const fileBuffer = Buffer.from(await currentFile.arrayBuffer());
      // const dataUrl =
      //   fileBuffer.byteLength <= maxPreviewBytesPerImage
      //     ? `data:${currentFile.type};base64,${fileBuffer.toString("base64")}`
      //     : null;

      attachmentsPayload.push({
        id: `att_${crypto.randomUUID()}`,
        name: currentFile.name,
        type: currentFile.type,
        size: currentFile.size,
        // dataUrl,
      });
    }

    const fieldErrors: SubmitEstimateResult["fieldErrors"] = {};

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

    if (hasRealAttachment) {
      const mimeType = attachmentFile.type || "";
      const isImage = mimeType.startsWith("image/");
      const isPdf = ALLOWED_ATTACHMENT_TYPES.includes(mimeType);

      if (!isImage && !isPdf) {
        fieldErrors.attachment = "validationAttachmentType";
      } else if (attachmentFile.size > MAX_ATTACHMENT_SIZE_BYTES) {
        fieldErrors.attachment = "validationAttachmentSize";
      }
    }

    if (!consentAccepted) {
      fieldErrors.consent = "validationConsentRequired";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, fieldErrors };
    }

    try {
      const clientFullName = `${firstName} ${lastName}`.trim();
      const normalizedGender: "male" | "female" | undefined =
        gender === "male" || gender === "female"
          ? (gender as "male" | "female")
          : undefined;

      const requestPayload = {
        clientName: clientFullName,
        phone: phone,
        email: email,
        comment: message || undefined,
        company,
        attachments: attachmentsPayload,
        gender: normalizedGender,
      };

      const headerBag = await headers();
      const protocol = headerBag.get("x-forwarded-proto") ?? "http";
      const host = headerBag.get("host")!;
      const baseUrl = `${protocol}://${host}`;

      const createRequestResponse = await fetch(`${baseUrl}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (
        !(
          createRequestResponse.status >= 200 &&
          createRequestResponse.status < 300
        )
      ) {
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
