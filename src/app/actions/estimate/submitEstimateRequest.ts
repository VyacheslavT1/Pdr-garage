"use server";

export type SubmitEstimateResult = {
  ok: boolean;
  fieldErrors?: {
    gender?: string; // i18n key
    firstName?: string; // i18n key
    lastName?: string; // i18n key
    phone?: string; // i18n key
    email?: string; // i18n key
    message?: string; // i18n key
    attachment?: string; // i18n key
    consent?: string;
  };
  formError?: string; // i18n key
};

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ATTACHMENT_TYPES = ["application/pdf"]; // plus any image/*
const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 2000;

// ВАЖНО: не трогаю имена/сигнатуры — оставляю как есть
function isValidName(firstName: string, lastName: string) {
  return /^[A-Za-zА-Яа-я]+$/.test(firstName || lastName);
}

function isValidEmail(email: string) {
  // Simple but sufficient on the server
  return /\S+@\S+\.\S+/.test(email);
}

function normalizePhone(phone: string) {
  // Убираем все символы кроме цифр, плюса, скобок, дефисов и пробелов
  return phone.replace(/[^\d+()\- ]+/g, "");
}

function isValidFrenchPhone(phone: string): boolean {
  // Французский формат: 0X XX XX XX XX (с пробелами или без)
  const frenchRegex = /^0[1-9](\s?\d{2}){4}$/;
  // Международный французский формат: +33 X XX XX XX XX
  const internationalFrenchRegex = /^\+33\s?[1-9](\s?\d{2}){4}$/;

  return frenchRegex.test(phone) || internationalFrenchRegex.test(phone);
}

export async function submitEstimateRequest(
  formData: FormData
): Promise<SubmitEstimateResult> {
  try {
    // Чтение полей из FormData
    const gender = String(formData.get("gender") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const phoneRaw = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    // Honeypot из формы (если ты добавил <input name="company" ... />)
    const company = String(formData.get("company") ?? "").trim();

    //  согласие (чекбокс). Если не отмечен — ключа в FormData просто нет.
    const consentAccepted = formData.has("consentToContact");

    // Файл
    const attachmentEntry = formData.get("attachment");
    const attachmentFile =
      attachmentEntry instanceof File ? (attachmentEntry as File) : null;
    const hasRealAttachment =
      !!attachmentFile && !!attachmentFile.name && attachmentFile.size > 0;

    // Валидация (оставляю твою логику; без переименований)
    const fieldErrors: SubmitEstimateResult["fieldErrors"] = {};

    // gender
    if (!["male", "female"].includes(gender)) {
      fieldErrors.gender = "validationGenderInvalid";
    }

    // firstName / lastName
    if (!firstName) {
      fieldErrors.firstName = "validationFirstNameRequired";
    } else if (firstName.length > MAX_NAME_LENGTH) {
      fieldErrors.firstName = "validationFirstNameMax";
    } else if (!isValidName) {
      // оставляю как в твоём коде (не меняю поведение)
      fieldErrors.firstName = "validationFirstNameSymbols";
    }

    if (!lastName) {
      fieldErrors.lastName = "validationLastNameRequired";
    } else if (lastName.length > MAX_NAME_LENGTH) {
      fieldErrors.lastName = "validationLastNameMax";
    } else if (!isValidName) {
      // оставляю как в твоём коде (не меняю поведение)
      fieldErrors.lastName = "validationLastNameSymbols";
    }

    // phone
    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      fieldErrors.phone = "validationPhoneRequired";
    } else if (isValidFrenchPhone(phone)) {
      // Французский формат валиден
    } else if (phone.replace(/\D/g, "").length < 8 || phone.length > 20) {
      fieldErrors.phone = "validationPhoneInvalid";
    }

    // email
    if (!email) {
      fieldErrors.email = "validationEmailRequired";
    } else if (!isValidEmail(email)) {
      fieldErrors.email = "validationEmailInvalid";
    }

    // message
    if (!message) {
      fieldErrors.message = "validationMessageRequired";
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      fieldErrors.message = "validationMessageMax";
    }

    // attachment
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

    // требуем согласие
    if (!consentAccepted) {
      fieldErrors.consent = "validationConsentRequired";
    }

    // Если есть ошибки — возвращаем их
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, fieldErrors };
    }

    // ⬇️ ДОБАВЛЕНО: создаём заявку в системе через публичный API /api/requests
    try {
      const clientFullName = `${firstName} ${lastName}`.trim();

      const requestPayload = {
        clientName: clientFullName,
        phone: phone, // уже нормализован
        comment: message || undefined,
        company, // honeypot: если бот заполнил — API вернёт 204 и не создаст запись
      };

      const createRequestResponse = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      // Любой 2xx (включая 204 при сработавшем honeypot) — считаем успехом.
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
    // ⬆️ КОНЕЦ ДОБАВЛЕННОГО БЛОКА

    // Успех — дополнительные side effects (email/БД/storage) можно добавить позже
    return { ok: true };
  } catch {
    return {
      ok: false,
      formError: "formSubmitFailed",
    };
  }
}
