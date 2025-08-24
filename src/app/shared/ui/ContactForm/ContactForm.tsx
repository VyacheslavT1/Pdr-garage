// src/app/shared/ui/ContactForm/ContactForm.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { EstimateFormProps } from "./ContactForm.types";
import { UserGender } from "./ContactForm.types";
import { useEstimateForm } from "./hooks/useEstimateForm";
import styles from "./ContactForm.module.css";
import RadioGroup from "./parts/RadioGroup/RadioGroup";

export default function ContactForm(props: EstimateFormProps) {
  const { onSubmit, className, prefill, disclaimerText } = props;
  const t = useTranslations("ContactForm");

  const { form } = useEstimateForm({
    defaultValues: prefill,
    translate: (messageKey) => t(messageKey),
  });

  const { register, handleSubmit, formState, setValue, watch } = form;

  const { errors, isSubmitting, isSubmitSuccessful } = formState;

  return (
    <form
      className={`${styles.form} ${className ?? ""}`}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      aria-describedby="contact-form-disclaimer"
    >
      <RadioGroup
        name="userGender"
        legendText={"labels.userGender"}
        options={[
          { value: UserGender.Male, label: t("options.gender.male") },
          {
            value: UserGender.Female,
            label: t("options.gender.female"),
          },
        ]}
        register={register}
        ariaInvalid={!!errors.userGender}
        errorMessage={
          errors.userGender ? String(errors.userGender.message) : undefined
        }
      />
    </form>
  );
}
