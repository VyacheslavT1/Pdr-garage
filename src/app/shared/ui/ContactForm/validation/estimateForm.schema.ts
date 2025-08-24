// src/app/shared/ui/ContactForm/validation/estimateForm.schema.ts

import * as Yup from "yup";
import type { ObjectSchema } from "yup";
import type { SimpleEstimateFormValues } from "../ContactForm.types";
import { UserGender } from "../ContactForm.types";

/**
 * Константы валидации для файла.
 * Разрешаем 1 файл с типами изображений + pdf (на случай, если клиент приложит акт/оценку).
 */
export const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/**
 * Регэкспы для телефона:
 * - E.164: + и 8–15 цифр (универсально для отправки SMS/WhatsApp)
 * - Французский локальный формат: 0X XX XX XX XX (пробелы допускаем)
 * Вы можете оставить оба или убрать французский, если не нужен.
 */
const E164_PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;
const FR_LOCAL_PHONE_REGEX = /^0[1-9](\s?\d{2}){4}$/;

/**
 * Фабрика Yup‑схемы.
 * На вход принимает функцию переводчика (или заглушку), чтобы возвращать локализованные ошибки.
 * Если у вас уже есть хук t = useTranslations("form"), передайте сюда (msgKey) => t(msgKey).
 */
export function createEstimateFormSchema(
  translate: (messageKey: string) => string = (messageKey) => messageKey
): ObjectSchema<SimpleEstimateFormValues> {
  return Yup.object({
    userGender: Yup.mixed<UserGender>()
      .oneOf(
        [UserGender.Male, UserGender.Female],
        translate("errors.gender.invalid")
      )
      .required(translate("errors.required")),

    userFirstName: Yup.string()
      .trim()
      .min(2, translate("errors.firstName.min"))
      .max(80, translate("errors.firstName.max"))
      .required(translate("errors.required")),

    userLastName: Yup.string()
      .trim()
      .min(2, translate("errors.lastName.min"))
      .max(80, translate("errors.lastName.max"))
      .required(translate("errors.required")),

    contactPhone: Yup.string()
      .trim()
      .required(translate("errors.required"))
      .test(
        "is-valid-phone",
        translate("errors.phone.invalid"),
        (inputPhone) => {
          if (!inputPhone) return false;
          const normalizedPhone = inputPhone.replace(/\s+/g, "");
          return (
            E164_PHONE_REGEX.test(normalizedPhone) ||
            FR_LOCAL_PHONE_REGEX.test(normalizedPhone)
          );
        }
      ),

    contactEmail: Yup.string()
      .trim()
      .email(translate("errors.email.invalid"))
      .required(translate("errors.required")),

    damageDescription: Yup.string()
      .trim()
      .min(10, translate("errors.description.min"))
      .max(1000, translate("errors.description.max"))
      .required(translate("errors.required")),

    /**
     * Вложение — опциональное поле (либо File, либо null).
     * Если файл есть, проверяем тип и размер.
     */
    attachmentFile: Yup.mixed<File>()
      .nullable()
      .test("file-type", translate("errors.file.type"), (maybeFile) => {
        if (!maybeFile) return true; // поле опционально
        return ALLOWED_ATTACHMENT_MIME_TYPES.includes(
          maybeFile.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]
        );
      })
      .test("file-size", translate("errors.file.size"), (maybeFile) => {
        if (!maybeFile) return true;
        return maybeFile.size <= MAX_ATTACHMENT_SIZE_BYTES;
      }),
  }) as ObjectSchema<SimpleEstimateFormValues>;
}

/**
 * Вспомогательная функция: готовая схема с "сырыми" i18n-ключами как текстами ошибок.
 * Удобно при первоначальной интеграции — позже можно подменить на реальный translate.
 */
export const estimateFormSchemaWithMessageKeys = createEstimateFormSchema();
