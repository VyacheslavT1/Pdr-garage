// Минимальный контракт для формы сметы (упрощённая версия)

export enum UserGender {
  Male = "male",
  Female = "female",
}

/**
 * Данные, которые собирает форма и отправляет наружу (onSubmit).
 * Никаких лишних полей — только то, что вы указали.
 */
export interface SimpleEstimateFormValues {
  userGender: UserGender; // обязательное: one of male/female/other
  userFirstName: string; // обязательное: 2–80 символов
  userLastName: string; // обязательное: 2–80 символов
  contactPhone: string; // обязательное: телефон (формат уточним в схеме)
  contactEmail: string; // обязательное: корректный email
  damageDescription: string; // обязательное: 10–1000 символов
  attachmentFile?: File | null; // опционально: 1 файл (jpg/png/webp/pdf, лимиты уточним в схеме)
}

/**
 * Пропсы универсального UI‑компонента формы.
 * Логика отправки — снаружи, компонент только собирает и валидирует данные.
 */
export interface EstimateFormProps {
  onSubmit: (values: SimpleEstimateFormValues) => Promise<void>;
  className?: string;

  /**
   * Предзаполнение полей (например, если часть данных уже известна).
   * Сюда передаются ТОЛЬКО поля из SimpleEstimateFormValues.
   */
  prefill?: Partial<SimpleEstimateFormValues>;

  /**
   * Подпись‑дисклеймер под формой («стоимость ориентировочная...»).
   * Это текст интерфейса, не поле формы.
   * Если не передать — компонент покажет дефолтный вариант из i18n.
   */
  disclaimerText?: string;
}
