"use client";

import React, { useState } from "react";

import CheckboxIcon from "@/shared/Icons/checkbox-line.svg";
import CheckboxCheckedIcon from "@/shared/Icons/checkbox-fill.svg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./Checkbox.module.css";
import { inter } from "@/shared/ui/fonts";

export type CheckboxVariant = "default" | "labeled";

export interface CheckboxProps {
  name: string;
  id: string;
  checked?: boolean;
  value?: string;
  variant?: CheckboxVariant;
  label?: string;
  color?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  name,
  id,
  checked = false,
  value,
  variant = "default",
  label,
  color,
  required = false,
  disabled = false,
  hasError = false,
  errorMessage,
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(!!checked);
  const t = useTranslations("EstimateRequestForm");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  const errorId = hasError ? `${id}-error` : undefined;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className={styles.input}
          defaultChecked={checked}
          onChange={handleChange}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={errorId}
        />

        <span className={styles.icon} aria-hidden="true" style={{ color }}>
          {isChecked ? <CheckboxCheckedIcon /> : <CheckboxIcon />}
        </span>

        {variant === "labeled" && label && (
          <span className={`${inter.className} ${styles.text}`}>
            {label}{" "}
            <span className={styles.policyNote}>
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                {t("consentPrivacyLink")}
              </Link>
            </span>
          </span>
        )}
      </label>

      {hasError && errorMessage && (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
