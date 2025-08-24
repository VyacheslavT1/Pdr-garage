"use client";

import React, { useState } from "react";

import CheckboxIcon from "@/app/shared/Icons/checkbox-line.svg";
import CheckboxCheckedIcon from "@/app/shared/Icons/checkbox-fill.svg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { inter } from "@/app/shared/ui/fonts";
import styles from "./Checkbox.module.css";

export type CheckboxVariant = "default" | "labeled";

export interface CheckboxProps {
  /** ВАЖНО: имя — ключ, под которым чекбокс попадёт в FormData */
  name: string;
  id: string;

  /** Начальное состояние (используется как defaultChecked, НЕ контролируемый) */
  checked?: boolean;

  /** Значение, которое попадёт в FormData, если чекбокс отмечен */
  value?: string; // по умолчанию браузер кладёт "on"

  /** Визуальные опции */
  variant?: CheckboxVariant;
  label?: string;
  color?: string; // иконки используют currentColor

  /** Семантика/валидность */
  required?: boolean; // если нужен обязательный чекбокс
  disabled?: boolean;

  /** Отрисовка ошибок (строка уже локализована или это i18n-ключ, отрисованный выше) */
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
  // Локальное состояние только для переключения иконок
  const [isChecked, setIsChecked] = useState<boolean>(!!checked);
  const t = useTranslations("EstimateRequestForm");

  // Инпут остаётся неконтролируемым (defaultChecked), а это событие — только для иконки
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  const errorId = hasError ? `${id}-error` : undefined;

  return (
    <div className={styles.wrapper}>
      {/* label оборачивает, чтобы клик по иконке/тексту переключал инпут нативно */}
      <label htmlFor={id} className={styles.label}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className={styles.input}
          defaultChecked={checked} // неконтролируемый режим
          onChange={handleChange} // только для локального isChecked (иконки)
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={errorId}
        />

        {/* Иконка: меняется в зависимости от состояния */}
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
