"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/modules/requests/feature/estimate-request/ui/EstimateRequestForm/parts/InputField/InputField";
import Textarea from "@/modules/requests/feature/estimate-request/ui/EstimateRequestForm/parts/Textarea/Textarea";
import Button from "@/shared/ui/button/Button";
import Select from "@/shared/ui/select/Select";
import styles from "./ReviewCreateForm.module.scss";

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
  const [ratingValue, setRatingValue] = useState<string>("");
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
  const [formResetKey, setFormResetKey] = useState<number>(0);

  function normalizeName(raw: string): string {
    const trimmed = (raw || "").trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    const normalizeToken = (token: string) => {
      // Handle hyphenated or apostrophized parts: Jean-Luc, O'Neill
      const splitBy = (s: string, sep: RegExp) =>
        s.split(sep).map((part) =>
          part
            ? part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase()
            : part
        );
      if (token.includes("-")) return splitBy(token, /-/g).join("-");
      if (token.includes("'")) return splitBy(token, /'/g).join("'");
      if (token.includes("’")) return splitBy(token, /’/g).join("’");
      return token.charAt(0).toLocaleUpperCase() + token.slice(1).toLocaleLowerCase();
    };
    return trimmed
      .split(" ")
      .filter(Boolean)
      .map(normalizeToken)
      .join(" ");
  }

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (!submitSuccessMessage) return;
    const timer = setTimeout(() => setSubmitSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [submitSuccessMessage]);

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

    recomputeReadiness();
    formElement.addEventListener("input", recomputeReadiness);
    formElement.addEventListener("change", recomputeReadiness);
    return () => {
      formElement.removeEventListener("input", recomputeReadiness);
      formElement.removeEventListener("change", recomputeReadiness);
    };
  }, []);

  function validate(values?: {
    clientName?: string;
    rating?: string;
    comment?: string;
  }): string | null {
    const clientName = values?.clientName ?? clientNameValue;
    const rating = values?.rating ?? ratingValue;
    const comment = values?.comment ?? commentValue;

    if (!clientName.trim()) return t("errors.clientNameRequired");
    if (clientName.trim().length > 120) return t("errors.clientNameTooLong");
    if (rating) {
      const numeric = Number(rating);
      if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
        return t("errors.ratingInvalid");
      }
    }
    if (comment && comment.length > 2000) return t("errors.commentTooLong");
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const clientNameRaw = String(formData.get("clientName") ?? "").trim();
    const commentRaw = String(formData.get("comment") ?? "").trim();
    const ratingRaw = ratingValue;
    const ratingNumber = ratingRaw ? Number(ratingRaw) : null;

    const validationError = validate({
      clientName: clientNameRaw,
      rating: ratingRaw,
      comment: commentRaw,
    });
    if (validationError) {
      setSubmitErrorMessage(validationError);
      return;
    }

    const payload: ReviewCreatePayload = {
      clientName: normalizeName(clientNameRaw),
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
      // Hard reset: re-mount form subtree to clear uncontrolled inputs state
      setClientNameValue("");
      setRatingValue("");
      setCommentValue("");
      formElement.reset();
      setFormResetKey((k) => k + 1);
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
      key={formResetKey}
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
          const numericPart = selectedLabel.split(" ")[0];
          setRatingValue(numericPart);
        }}
      />

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
