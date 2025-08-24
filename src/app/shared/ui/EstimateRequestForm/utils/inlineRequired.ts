import type { SubmitEstimateResult } from "@/app/actions/estimate/submitEstimateRequest";

export function getInlineRequiredErrors(
  form: HTMLFormElement
): SubmitEstimateResult["fieldErrors"] {
  const errors: SubmitEstimateResult["fieldErrors"] = {};
  const get = (name: string) => form.elements.namedItem(name);

  // gender (radio-группа)
  const genderChecked = form.querySelector<HTMLInputElement>(
    'input[name="gender"]:checked'
  );
  if (!genderChecked) errors.gender = "validationGenderInvalid";

  // firstName / lastName / phone / email — только пустота
  const requiredField = ["firstName", "lastName", "phone", "email"] as const;
  for (const fieldName of requiredField) {
    const el = get(fieldName);
    if (el instanceof HTMLInputElement && el.required && !el.value.trim()) {
      errors[fieldName] = "validation.required";
    }
  }

  // message — обязательно
  const message = get("message");
  if (
    message instanceof HTMLTextAreaElement &&
    message.required &&
    !message.value.trim()
  ) {
    errors.message = "validationMessageRequired";
  }

  // attachment — хотя бы один файл обязателен
  const attachment = get("attachment");
  if (
    attachment instanceof HTMLInputElement &&
    attachment.type === "file" &&
    attachment.required &&
    (!attachment.files || attachment.files.length === 0)
  ) {
    errors.attachment = "validationAttachmentRequired";
  }

  // consent — чекбокс обязателен
  const consent = get("consentToContact");
  if (
    consent instanceof HTMLInputElement &&
    consent.required &&
    !consent.checked
  ) {
    errors.consent = "validationConsentRequired";
  }

  return errors;
}
