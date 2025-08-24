"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./Textarea.module.css";

export interface TextAreaProps {
  id: string;
  name: string;
  title: string;
  placeholder?: string; // можно не передавать
  rows?: number;
  cols?: number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  hasError?: boolean;
  errorMessage?: string;
  defaultValue?: string;
}

const Textarea: React.FC<TextAreaProps> = ({
  id,
  name,
  title,
  placeholder,
  rows = 4,
  cols,
  required = false,
  minLength,
  maxLength,
  hasError = false,
  errorMessage,
  defaultValue,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [hasContent, setHasContent] = useState(false);

  // На монтировании сверяем текущее значение (вдруг предзаполнено сервером)
  useEffect(() => {
    if (textareaRef.current) {
      setHasContent(textareaRef.current.value.trim().length > 0);
    }
  }, []);

  const handleInputInternal = () => {
    if (textareaRef.current) {
      setHasContent(textareaRef.current.value.trim().length > 0);
    }
  };

  const errorId = hasError ? `${id}-error` : undefined;

  return (
    <div
      className={`${styles.textareaContainer} ${
        hasContent ? styles.isFilled : ""
      }`}
    >
      <h3 className={styles.title}>{title}</h3>

      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        aria-invalid={hasError || undefined}
        aria-describedby={errorId}
        onInput={handleInputInternal}
        defaultValue={defaultValue}
        className={`${styles.textarea} ${hasError ? styles.error : ""}`}
      />

      {hasError && errorMessage && (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Textarea;
