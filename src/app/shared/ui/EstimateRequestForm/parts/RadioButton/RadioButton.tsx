"use client";

import React from "react";
import styles from "./RadioButton.module.css";

type RadioButtonProps = {
  id: string;
  name: string;
  value: string;
  /** ВАЖНО: используется как начальное значение (defaultChecked), компонент остаётся неконтролируемым */
  checked: boolean;
  label: string;
  required?: boolean;
  /** Передаём признак ошибки снаружи на случай подсветки поля */
  ariaInvalid?: boolean;
};

export default function RadioButton({
  id,
  name,
  value,
  checked,
  label,
  required,
  ariaInvalid,
}: RadioButtonProps) {
  return (
    <div className={styles.radioContainer}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        // Неконтролируемый режим: не передаём onChange, не используем checked
        defaultChecked={checked}
        required={required}
        aria-invalid={ariaInvalid || undefined}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
