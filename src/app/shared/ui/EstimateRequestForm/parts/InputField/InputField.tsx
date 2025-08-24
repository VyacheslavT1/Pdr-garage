"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  extractFilesFromChangeEvent,
  removeFileByIndex,
  applyFilesToNativeInput,
  mergeUniqueFiles,
} from "./helpers/fileInputHelpers";
import Button from "@/app/shared/ui/Button/Button";
import CloseIcon from "@/app/shared/Icons/close.svg";
import styles from "./InputField.module.scss";

export enum InputType {
  Text = "text",
  File = "file",
}

export interface InputFieldProps {
  id: string;
  label?: string;
  name: string;
  type?: InputType;

  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;

  accept?: string;
  multiple?: boolean;

  hasError?: boolean;
  errorMessage?: string;

  /** значение по умолчанию (для текстовых полей) */
  defaultValue?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  name,
  type = InputType.Text,

  required = false,
  maxLength,
  minLength,
  pattern,
  inputMode,
  autoComplete,

  accept,
  multiple,

  hasError = false,
  errorMessage,
  defaultValue, // добавили
}) => {
  const [inputType] = useState<InputType>(type);
  const isFileInput = inputType === InputType.File;
  const t = useTranslations("EstimateRequestForm");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const errorId = hasError ? `${id}-error` : undefined;

  const buttonLabel = isFileInput
    ? label ?? t("uploadButtonLabel")
    : label ?? "";

  const describedBy =
    [
      errorId,
      isFileInput && selectedFiles.length === 0 ? `${id}-hint` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const handleFileChangeInternal = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const incoming = extractFilesFromChangeEvent(event);

    setSelectedFiles((prev) => {
      const merged = mergeUniqueFiles(prev, incoming);
      applyFilesToNativeInput(fileInputRef.current, merged);
      return merged;
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => {
      const nextFiles = removeFileByIndex(prev, indexToRemove);
      applyFilesToNativeInput(fileInputRef.current, nextFiles);
      return nextFiles;
    });
  };

  return (
    <div className={styles.inputField}>
      <div
        className={`${styles.inputContainer} ${
          isFileInput ? styles.fileMode : ""
        }`}
      >
        {buttonLabel && (
          <label htmlFor={id} className={styles.label}>
            {buttonLabel}
          </label>
        )}

        <input
          id={id}
          name={name}
          type={inputType}
          placeholder=" "
          ref={isFileInput ? fileInputRef : undefined}
          defaultValue={!isFileInput ? defaultValue : undefined}
          {...(isFileInput
            ? {
                accept,
                multiple,
                onChange: handleFileChangeInternal,
              }
            : {
                minLength,
                maxLength,
                pattern,
                inputMode,
                autoComplete,
              })}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={`${styles.input} ${hasError ? styles.error : ""}`}
        />

        {/* placeholder */}
        {isFileInput && selectedFiles.length === 0 && (
          <div
            id={`${id}-hint`}
            className={styles.placeholder}
            aria-live="polite"
          >
            {t("placeholderText")}
          </div>
        )}

        {/* files list */}
        {isFileInput && selectedFiles.length > 0 && (
          <div className={styles.fileList} aria-live="polite">
            {selectedFiles.map((file, i) => (
              <span
                key={`${file.name}-${i}`}
                className={styles.uploadedFileBadge}
                title={file.name}
              >
                <span>{file.name}</span>
                <Button
                  variant="secondary"
                  aria-label={t("removeFileAriaLabel") || "Remove file"}
                  onClick={() => handleRemoveFile(i)}
                >
                  <CloseIcon />
                </Button>
              </span>
            ))}
          </div>
        )}
      </div>

      {hasError && errorMessage && (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default InputField;
