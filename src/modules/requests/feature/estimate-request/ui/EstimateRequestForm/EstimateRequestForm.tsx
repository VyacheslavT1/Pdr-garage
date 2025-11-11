"use client";

import React, { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { enforceSubmitEnabled } from "./utils/enforceSubmitEnabled";
import { validateForm, type ValidationErrors } from "./utils/formValidation";
import {
  submitEstimateRequest,
  type SubmitEstimateResult,
} from "@/modules/requests/feature/estimate-request/model/submit";
import { useTranslations } from "next-intl";
import RadioButton from "./parts/RadioButton/RadioButton";
import InputField, { InputType } from "./parts/InputField/InputField";
import Textarea from "./parts/Textarea/Textarea";
import Checkbox from "./parts/Checkbox/Checkbox";
import Button from "@/shared/ui/button/Button";

import { formDataToValues } from "./utils/formValues";
import styles from "./EstimateRequestForm.module.scss";

const initialSubmitState: SubmitEstimateResult = { ok: false };

export default function EstimateRequestForm() {
  const t = useTranslations("EstimateRequestForm");
  const [gender, setGender] = useState("");
  const [formResetKey, setFormResetKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [inlineErrors, setInlineErrors] = useState<ValidationErrors>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const [submitState, execute, isPending] = useActionState<
    SubmitEstimateResult,
    FormData
  >(async (_previousState, formData) => {
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormValues(formDataToValues(formData));
      setInlineErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    const result = await submitEstimateRequest(formData);
    return result;
  }, initialSubmitState);

  const fieldErrors = submitState.fieldErrors ?? {};

  useEffect(() => {
    const detach = enforceSubmitEnabled(
      formRef.current,
      'button[type="submit"]',
      () => isPending
    );
    return detach;
  }, [isPending]);

  useEffect(() => {
    const isSuccess =
      submitState.ok && !submitState.fieldErrors && !submitState.formError;
    if (!isSuccess) return;

    formRef.current?.reset();
    setGender("");
    setInlineErrors({});
    setFormValues({});
    setFormResetKey((n) => n + 1);

    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [submitState]);

  const handleGenderChange = (
    event: React.ChangeEvent<HTMLFieldSetElement>
  ) => {
    const possibleInput = event.target as unknown;
    if (
      possibleInput instanceof HTMLInputElement &&
      possibleInput.name === "gender" &&
      possibleInput.type === "radio"
    ) {
      setGender(possibleInput.value);
    }
  };

  const displayErrors = { ...inlineErrors, ...fieldErrors };

  return (
    <div className={styles.formContainer}>
      <form
        key={formResetKey}
        ref={formRef}
        className={styles.form}
        encType="multipart/form-data"
        method="post"
      >
        <h3 className={styles.formTitle}>{t("formTitle")}</h3>

        <fieldset className={styles.formFieldset} onChange={handleGenderChange}>
          <RadioButton
            id="male"
            name="gender"
            value="male"
            checked={gender === "male"}
            label={t("genderMale")}
            required
            ariaInvalid={Boolean(fieldErrors.gender)}
          />
          <RadioButton
            id="female"
            name="gender"
            value="female"
            checked={gender === "female"}
            label={t("genderFemale")}
            required
            ariaInvalid={Boolean(fieldErrors.gender)}
          />

          {fieldErrors.gender && (
            <div className={styles.fieldError} role="alert">
              {t(fieldErrors.gender)}
            </div>
          )}
        </fieldset>

        <InputField
          id="firstName"
          name="firstName"
          label={t("firstNameLabel")}
          required
          maxLength={60}
          autoComplete="given-name"
          defaultValue={formValues.firstName || ""}
          hasError={Boolean(displayErrors.firstName)}
          errorMessage={
            displayErrors.firstName ? t(displayErrors.firstName) : undefined
          }
        />

        <InputField
          id="lastName"
          name="lastName"
          label={t("lastNameLabel")}
          required
          maxLength={60}
          autoComplete="family-name"
          defaultValue={formValues.lastName || ""}
          hasError={Boolean(displayErrors.lastName)}
          errorMessage={
            displayErrors.lastName ? t(displayErrors.lastName) : undefined
          }
        />

        <InputField
          id="phone"
          name="phone"
          label={t("phoneLabel")}
          required
          minLength={6}
          maxLength={20}
          inputMode="tel"
          autoComplete="tel"
          defaultValue={formValues.phone || ""}
          hasError={Boolean(displayErrors.phone)}
          errorMessage={
            displayErrors.phone ? t(displayErrors.phone) : undefined
          }
        />

        <InputField
          id="email"
          name="email"
          label="Email *"
          required
          inputMode="email"
          autoComplete="email"
          defaultValue={formValues.email || ""}
          hasError={Boolean(displayErrors.email)}
          errorMessage={
            displayErrors.email ? t(displayErrors.email) : undefined
          }
        />

        <Textarea
          id="message"
          name="message"
          title={t("messageLabel")}
          rows={4}
          maxLength={2000}
          required
          defaultValue={formValues.message || ""}
          hasError={Boolean(displayErrors.message)}
          errorMessage={
            displayErrors.message ? t(displayErrors.message) : undefined
          }
        />

        <InputField
          id="attachment"
          name="attachment"
          type={InputType.File}
          accept="image/*,application/pdf"
          multiple
          required={false}
          hasError={Boolean(displayErrors.attachment)}
          errorMessage={
            displayErrors.attachment ? t(displayErrors.attachment) : undefined
          }
        />

        <Checkbox
          id="consentToContact"
          name="consentToContact"
          variant="labeled"
          label={t("consentPrivacyText")}
          required
          hasError={Boolean(displayErrors.consent)}
          errorMessage={
            displayErrors.consent ? t(displayErrors.consent) : undefined
          }
        />
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="off"
            tabIndex={-1}
            defaultValue=""
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            formAction={execute}
          >
            {isPending ? t("submitPending") : t("submitLabel")}
          </Button>
        </div>

        {submitState.formError && (
          <div className={styles.formError} role="alert">
            {t("formSubmitFailed")}
          </div>
        )}

        {submitState.ok &&
          !submitState.fieldErrors &&
          !submitState.formError &&
          showSuccess && (
            <div className={styles.formSuccess} role="status">
              {t("submitSuccess")}
            </div>
          )}

        <p className={styles.disclaimer}>{t("disclaimerEstimateApprox")}</p>
      </form>
    </div>
  );
}
