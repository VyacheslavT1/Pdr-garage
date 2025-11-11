"use client";

import React from "react";
import styles from "./RadioButton.module.scss";

type RadioButtonProps = {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  label: string;
  required?: boolean;
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
        defaultChecked={checked}
        required={required}
        aria-invalid={ariaInvalid}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
