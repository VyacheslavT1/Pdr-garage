"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/button/Button";
import styles from "./CookieConsentBanner.module.scss";

const STORAGE_KEY = "cookie_consent";
type ConsentStatus = "accepted" | "rejected" | "custom";
type PreferenceKey = "analytics" | "marketing";
type Preferences = Record<PreferenceKey, boolean>;

type StoredConsent = { status: ConsentStatus; preferences: Preferences } | null;

const DEFAULT_PREFERENCES: Preferences = {
  analytics: false,
  marketing: false,
};

function getStoredConsent(): StoredConsent {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  if (raw === "accepted" || raw === "rejected") {
    return { status: raw, preferences: DEFAULT_PREFERENCES };
  }
  try {
    const parsed = JSON.parse(raw) as StoredConsent;
    if (
      parsed &&
      (parsed.status === "accepted" ||
        parsed.status === "rejected" ||
        parsed.status === "custom") &&
      parsed.preferences
    ) {
      return {
        status: parsed.status,
        preferences: {
          analytics: Boolean(parsed.preferences.analytics),
          marketing: Boolean(parsed.preferences.marketing),
        },
      };
    }
  } catch {
    // ignore parse error, show banner
  }
  return null;
}

function persistConsent(consent: StoredConsent) {
  if (typeof window === "undefined" || !consent) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

export default function CookieConsentBanner() {
  const t = useTranslations("CookieConsent");
  const [isVisible, setIsVisible] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setPreferences(stored.preferences);
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, []);

  function acceptAll() {
    // When preferences are visible, respect the custom toggles; otherwise accept everything.
    const consent: StoredConsent = showPreferences
      ? { status: "custom", preferences }
      : {
          status: "accepted",
          preferences: { analytics: true, marketing: true },
        };
    persistConsent(consent);
    setIsVisible(false);
  }

  function rejectAll() {
    const consent: StoredConsent = {
      status: "rejected",
      preferences: { analytics: false, marketing: false },
    };
    persistConsent(consent);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-label={t("title")}
      aria-live="polite"
    >
      <div className={styles.content}>
        <strong className={styles.title}>{t("title")}</strong>
        <p className={styles.description}>{t("description")}</p>
        {showPreferences && (
          <div
            className={styles.preferences}
            role="group"
            aria-label={t("customize")}
          >
            <PreferenceRow
              label={t("categories.essential.label")}
              description={t("categories.essential.description")}
              checked
              disabled
            />
            <PreferenceRow
              label={t("categories.analytics.label")}
              description={t("categories.analytics.description")}
              checked={preferences.analytics}
              onChange={(value) =>
                setPreferences((prev) => ({ ...prev, analytics: value }))
              }
            />
            <PreferenceRow
              label={t("categories.marketing.label")}
              description={t("categories.marketing.description")}
              checked={preferences.marketing}
              onChange={(value) =>
                setPreferences((prev) => ({ ...prev, marketing: value }))
              }
            />
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <Button variant="primary" onClick={acceptAll}>
          {t("accept")}
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowPreferences((prev) => !prev)}
          aria-expanded={showPreferences}
        >
          {t("customize")}
        </Button>
        <Button
          variant="secondary"
          onClick={rejectAll}
          className={styles.rejectButton}
        >
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={styles.preferenceRow}>
      <div className={styles.preferenceTexts}>
        <span className={styles.preferenceLabel}>{label}</span>
        <span className={styles.preferenceDescription}>{description}</span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        aria-disabled={disabled}
      />
    </label>
  );
}
