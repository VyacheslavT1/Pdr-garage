// src/app/shared/ui/ContactForm/hooks/useEstimateForm.ts

import { useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { SimpleEstimateFormValues } from "../ContactForm.types";
import { UserGender } from "../ContactForm.types";
import {
  createEstimateFormSchema,
  estimateFormSchemaWithMessageKeys,
} from "../validation/estimateForm.schema";

/**
 * Параметры и возвращаемые значения хука.
 */
export interface UseEstimateFormOptions {
  /**
   * Предзаполнение значений формы (например, если часть данных уже известна).
   * Передавайте только поля, которые реально присутствуют в SimpleEstimateFormValues.
   */
  defaultValues?: Partial<SimpleEstimateFormValues>;
  /**
   * Функция перевода для локализованных сообщений об ошибках Yup.
   * Например: (key) => t(`form.${key}`)
   * Если не передать, будут возвращаться «сырые» ключи (подключили estimateFormSchemaWithMessageKeys).
   */
  translate?: (messageKey: string) => string;
}

export interface UseEstimateFormReturn {
  /**
   * Полный набор методов и состояний RHF.
   * Вы будете деструктурировать register, control, handleSubmit, formState и т.д. в UI‑компоненте.
   */
  form: UseFormReturn<SimpleEstimateFormValues>;
}

/**
 * Инициализирует React Hook Form с Yup‑схемой валидации.
 * Вынесено в отдельный хук, чтобы ContactForm.tsx оставался «тонким» и переиспользуемым.
 */
export function useEstimateForm(
  options?: UseEstimateFormOptions
): UseEstimateFormReturn {
  const translate = options?.translate;

  // Выбираем схему: с реальным переводчиком или с «сырыми» ключами.
  const validationSchema = useMemo(() => {
    if (typeof translate === "function") {
      return createEstimateFormSchema(translate);
    }
    return estimateFormSchemaWithMessageKeys;
  }, [translate]);

  // Собираем дефолтные значения формы.
  // ВАЖНО: attachmentFile храним как File | null (совместимо со схемой).
  const mergedDefaultValues: SimpleEstimateFormValues = useMemo(
    () => ({
      userGender: options?.defaultValues?.userGender ?? UserGender.Male, // по умолчанию мужской; можно переопределить
      userFirstName: options?.defaultValues?.userFirstName ?? "",
      userLastName: options?.defaultValues?.userLastName ?? "",
      contactPhone: options?.defaultValues?.contactPhone ?? "",
      contactEmail: options?.defaultValues?.contactEmail ?? "",
      damageDescription: options?.defaultValues?.damageDescription ?? "",
      attachmentFile:
        options?.defaultValues?.attachmentFile !== undefined
          ? options?.defaultValues?.attachmentFile ?? null
          : null,
    }),
    [options?.defaultValues]
  );

  // Инициализация RHF.
  const form = useForm<SimpleEstimateFormValues>({
    mode: "onBlur", // валидируем при уходе с поля; можно сменить на onChange по желанию
    reValidateMode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues: mergedDefaultValues,
  });

  return { form };
}
