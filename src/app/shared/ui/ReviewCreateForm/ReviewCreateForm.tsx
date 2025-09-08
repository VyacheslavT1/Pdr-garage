"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/app/shared/ui/EstimateRequestForm/parts/InputField/InputField";
import Textarea from "@/app/shared/ui/EstimateRequestForm/parts/Textarea/Textarea";
import Button from "@/app/shared/ui/Button/Button";
import Select from "../Select/Select";
import styles from "./ReviewCreateForm.module.css";

type ReviewCreatePayload = {
  clientName: string;
  rating: number | null;
  comment: string | null;
};

type ReviewCreateFormProps = {
  onSubmitReview?: (payload: ReviewCreatePayload) => Promise<void> | void;
};

export default function ReviewCreateForm({
  onSubmitReview,
}: ReviewCreateFormProps) {
  const t = useTranslations("ReviewCreateForm");

  const [clientNameValue, setClientNameValue] = useState<string>("");
  const [ratingValue, setRatingValue] = useState<string>(""); // храним как строку для select
  const [commentValue, setCommentValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null
  );
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<
    string | null
  >(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const [isFormReady, setIsFormReady] = useState<boolean>(false);

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;

    const recomputeReadiness = () => {
      const formData = new FormData(formElement);
      const clientNameRaw = String(formData.get("clientName") ?? "").trim();
      const commentRaw = String(formData.get("comment") ?? "");
      const ratingRaw = String(formData.get("rating") ?? "");

      const isClientNameValid =
        clientNameRaw.length > 0 && clientNameRaw.length <= 120;

      const isRatingValid =
        ratingRaw === "" ||
        (!Number.isNaN(Number(ratingRaw)) &&
          Number(ratingRaw) >= 1 &&
          Number(ratingRaw) <= 5);

      const isCommentValid = commentRaw.length <= 2000;

      setIsFormReady(isClientNameValid && isRatingValid && isCommentValid);
    };

    // первичный расчёт + подписка
    recomputeReadiness();
    formElement.addEventListener("input", recomputeReadiness);
    formElement.addEventListener("change", recomputeReadiness);
    return () => {
      formElement.removeEventListener("input", recomputeReadiness);
      formElement.removeEventListener("change", recomputeReadiness);
    };
  }, []);

  function validate(): string | null {
    if (!clientNameValue.trim()) return t("errors.clientNameRequired");
    if (clientNameValue.trim().length > 120)
      return t("errors.clientNameTooLong");
    if (ratingValue) {
      const numeric = Number(ratingValue);
      if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
        return t("errors.ratingInvalid");
      }
    }
    if (commentValue && commentValue.length > 2000)
      return t("errors.commentTooLong");
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    // Берём реальные значения из формы (InputField/Textarea — неконтролируемые)
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const clientNameRaw = String(formData.get("clientName") ?? "").trim();
    const commentRaw = String(formData.get("comment") ?? "").trim();

    // Рейтинг берём из твоего Select (state), он опциональный
    const ratingRaw = ratingValue;
    const ratingNumber = ratingRaw ? Number(ratingRaw) : null;

    // Валидация — те же правила, но на фактических значениях
    if (!clientNameRaw) {
      setSubmitErrorMessage(t("errors.clientNameRequired"));
      return;
    }
    if (clientNameRaw.length > 120) {
      setSubmitErrorMessage(t("errors.clientNameTooLong"));
      return;
    }
    if (ratingNumber !== null) {
      if (
        !Number.isFinite(ratingNumber) ||
        ratingNumber < 1 ||
        ratingNumber > 5
      ) {
        setSubmitErrorMessage(t("errors.ratingInvalid"));
        return;
      }
    }
    if (commentRaw && commentRaw.length > 2000) {
      setSubmitErrorMessage(t("errors.commentTooLong"));
      return;
    }

    const payload: ReviewCreatePayload = {
      clientName: clientNameRaw,
      rating: ratingNumber,
      comment: commentRaw || null,
    };

    try {
      setIsSubmitting(true);

      if (onSubmitReview) {
        await onSubmitReview(payload);
      } else {
        const apiResponse = await fetch("/api/reviews/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
          const errorJson = await apiResponse.json().catch(() => ({}));
          const readableMessage =
            errorJson?.error && errorJson?.details
              ? `${errorJson.error}: ${JSON.stringify(errorJson.details)}`
              : `HTTP ${apiResponse.status}`;
          throw new Error(readableMessage);
        }
      }

      setSubmitSuccessMessage(t("messages.success"));
      // Сбрасываем DOM-поля формы
      formElement.reset();
      // Синхронизируем локальные состояния
      setClientNameValue("");
      setRatingValue("");
      setCommentValue("");
    } catch (caughtError: unknown) {
      const readableMessage =
        caughtError instanceof Error
          ? caughtError.message
          : t("messages.unknownError");
      setSubmitErrorMessage(readableMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      aria-labelledby="review-form-title"
    >
      <h2 id="review-form-title" className={styles.formTitle}>
        {t("title")}
      </h2>
      <div className={styles.formField}>
        <InputField
          id="review-client-name"
          name="clientName"
          label={t("fields.clientName")}
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={clientNameValue}
        />
      </div>
      <Select
        label={t("fields.rating")}
        options={["1 ★", "2 ★★", "3 ★★★", "4 ★★★★", "5 ★★★★★"]}
        value={ratingValue}
        onChange={(selectedLabel) => {
          const numericPart = selectedLabel.split(" ")[0]; // "3 ★★★" -> "3"
          setRatingValue(numericPart);
        }}
      />

      {/* Скрытое поле для FormData (чтобы disabled-логика и submit читали rating) */}
      <input type="hidden" name="rating" value={ratingValue} />

      <Textarea
        id="review-comment"
        name="comment"
        title={t("fields.comment")}
        rows={5}
        maxLength={2000}
        defaultValue={commentValue}
      />
      {submitErrorMessage && (
        <p role="alert" className={styles.formError}>
          {submitErrorMessage}
        </p>
      )}
      {submitSuccessMessage && (
        <p className={styles.formSuccess}>{submitSuccessMessage}</p>
      )}
      <div className={styles.actions}>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting || !isFormReady}
          aria-busy={isSubmitting}
          aria-disabled={isSubmitting || !isFormReady}
        >
          {isSubmitting ? t("buttons.submitting") : t("buttons.submit")}
        </Button>
      </div>
    </form>
  );
}
