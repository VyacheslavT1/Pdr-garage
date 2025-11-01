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

const FRENCH_PHONE_REGEX = /^0[1-9](\s?\d{2}){4}$/;
const INTERNATIONAL_FRENCH_REGEX = /^\+33\s?[1-9](\s?\d{2}){4}$/;
const GENERAL_PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[а-яёa-z\s\-']+$/i;

export function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return "validationPhoneRequired";
  if (FRENCH_PHONE_REGEX.test(phone)) return undefined;
  if (INTERNATIONAL_FRENCH_REGEX.test(phone)) return undefined;
  if (GENERAL_PHONE_REGEX.test(phone)) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!/^\d+$/.test(cleanPhone)) return "validationPhoneInvalid";
    if (cleanPhone.length < 8 || cleanPhone.length > 15)
      return "validationPhoneInvalid";
    return undefined;
  }
  return "validationPhoneInvalid";
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "validationEmailRequired";
  if (!EMAIL_REGEX.test(email)) return "validationEmailInvalid";
  return undefined;
}

export function validateName(
  name: string,
  fieldName: "firstName" | "lastName"
): string | undefined {
  if (!name.trim())
    return fieldName === "firstName"
      ? "validationFirstNameRequired"
      : "validationLastNameRequired";
  if (name.length > 60)
    return fieldName === "firstName"
      ? "validationFirstNameMax"
      : "validationLastNameMax";
  if (!NAME_REGEX.test(name))
    return fieldName === "firstName"
      ? "validationFirstNameSymbols"
      : "validationLastNameSymbols";
  return undefined;
}

export function validateMessage(message: string): string | undefined {
  if (!message.trim()) return "validationMessageRequired";
  if (message.length < 10) return "validationMessageMin";
  if (message.length > 2000) return "validationMessageMax";
  return undefined;
}

export function validateGender(gender: string): string | undefined {
  if (!gender || !["male", "female"].includes(gender))
    return "validationGenderInvalid";
  return undefined;
}

export function validateConsent(consent: boolean): string | undefined {
  if (!consent) return "validationConsentRequired";
  return undefined;
}

export function validateForm(formData: FormData): ValidationErrors {
  const errors: ValidationErrors = {};
  const gender = String(formData.get("gender") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const consent = formData.has("consentToContact");

  const genderError = validateGender(gender);
  if (genderError) errors.gender = genderError;
  const firstNameError = validateName(firstName, "firstName");
  if (firstNameError) errors.firstName = firstNameError;
  const lastNameError = validateName(lastName, "lastName");
  if (lastNameError) errors.lastName = lastNameError;
  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const messageError = validateMessage(message);
  if (messageError) errors.message = messageError;
  const consentError = validateConsent(consent);
  if (consentError) errors.consent = consentError;

  return errors;
}

