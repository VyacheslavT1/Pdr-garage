// Функции валидации для формы EstimateRequestForm

export interface ValidationErrors {
  gender?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  message?: string;
  attachment?: string;
  consent?: string;
}

// Регулярные выражения для валидации
// Французский формат: 0X XX XX XX XX (с пробелами или без)
const FRENCH_PHONE_REGEX = /^0[1-9](\s?\d{2}){4}$/;
// Международный формат: +33 X XX XX XX XX
const INTERNATIONAL_FRENCH_REGEX = /^\+33\s?[1-9](\s?\d{2}){4}$/;
// Общий формат для других стран
const GENERAL_PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[а-яёa-z\s\-']+$/i;

// Валидация телефона
export function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) {
    return "validationPhoneRequired";
  }

  // Проверяем французские форматы
  if (FRENCH_PHONE_REGEX.test(phone)) {
    return undefined; // Французский формат валиден
  }

  if (INTERNATIONAL_FRENCH_REGEX.test(phone)) {
    return undefined; // Международный французский формат валиден
  }

  // Проверяем общий формат
  if (GENERAL_PHONE_REGEX.test(phone)) {
    // Убираем все пробелы, скобки, дефисы и проверяем на цифры
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Проверяем, что содержит только цифры
    if (!/^\d+$/.test(cleanPhone)) {
      return "validationPhoneInvalid";
    }

    // Проверяем длину (8-15 цифр)
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return "validationPhoneInvalid";
    }

    return undefined;
  }

  return "validationPhoneInvalid";
}

// Валидация email
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return "validationEmailRequired";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "validationEmailInvalid";
  }

  return undefined;
}

// Валидация имени/фамилии
export function validateName(
  name: string,
  fieldName: "firstName" | "lastName"
): string | undefined {
  if (!name.trim()) {
    return fieldName === "firstName"
      ? "validationFirstNameRequired"
      : "validationLastNameRequired";
  }

  if (name.length > 60) {
    return fieldName === "firstName"
      ? "validationFirstNameMax"
      : "validationLastNameMax";
  }

  if (!NAME_REGEX.test(name)) {
    return fieldName === "firstName"
      ? "validationFirstNameSymbols"
      : "validationLastNameSymbols";
  }

  return undefined;
}

// Валидация сообщения
export function validateMessage(message: string): string | undefined {
  if (!message.trim()) {
    return "validationMessageRequired";
  }

  if (message.length < 10) {
    return "validationMessageMin";
  }

  if (message.length > 2000) {
    return "validationMessageMax";
  }

  return undefined;
}

// Валидация пола
export function validateGender(gender: string): string | undefined {
  if (!gender || !["male", "female"].includes(gender)) {
    return "validationGenderInvalid";
  }

  return undefined;
}

// Валидация согласия
export function validateConsent(consent: boolean): string | undefined {
  if (!consent) {
    return "validationConsentRequired";
  }

  return undefined;
}

// Основная функция валидации формы
export function validateForm(formData: FormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Пол
  const gender = String(formData.get("gender") ?? "").trim();
  const genderError = validateGender(gender);
  if (genderError) errors.gender = genderError;

  // Имя
  const firstName = String(formData.get("firstName") ?? "").trim();
  const firstNameError = validateName(firstName, "firstName");
  if (firstNameError) errors.firstName = firstNameError;

  // Фамилия
  const lastName = String(formData.get("lastName") ?? "").trim();
  const lastNameError = validateName(lastName, "lastName");
  if (lastNameError) errors.lastName = lastNameError;

  // Телефон
  const phone = String(formData.get("phone") ?? "").trim();
  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;

  // Email
  const email = String(formData.get("email") ?? "").trim();
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  // Сообщение
  const message = String(formData.get("message") ?? "").trim();
  const messageError = validateMessage(message);
  if (messageError) errors.message = messageError;

  // Согласие
  const consent = formData.has("consentToContact");
  const consentError = validateConsent(consent);
  if (consentError) errors.consent = consentError;

  return errors;
}
