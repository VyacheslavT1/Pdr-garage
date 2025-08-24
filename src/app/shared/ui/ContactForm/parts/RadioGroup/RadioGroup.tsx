// src/app/shared/ui/ContactForm/parts/RadioGroup.tsx

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: "userGender"; // фиксируем под твоё поле
  legendText: string;
  options: RadioOption[]; // [{ value, label }]
  register: ReturnType<any>; // сюда передаем register("userGender") из RHF
  ariaInvalid?: boolean;
  errorMessage?: string;
}
export default function RadioGroup(props: RadioGroupProps) {
  const { name, legendText, options, register, ariaInvalid, errorMessage } =
    props;
  const t = useTranslations("ContactForm");
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{t(legendText)}</legend>
      <div role="radiogroup" aria-invalid={ariaInvalid || undefined}>
        {options.map((radio) => (
          <label key={radio.value} className={styles.label}>
            <input type="radio" value={radio.value} {...register(name)} />
            {radio.label}
          </label>
        ))}
      </div>
      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
    </fieldset>
  );
}
