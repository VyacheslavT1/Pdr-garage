"use client";

import React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Dropdown from "@/shared/ui/dropdown/Dropdown";
import GlobeIcon from "@/shared/Icons/globe.svg";
import Button from "@/shared/ui/button/Button";
import styles from "./LanguageSwitcher.module.scss";

const locales = ["fr", "en", "ru"];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLocale = useLocale();

  const query = searchParams.toString();
  const href = `${pathname}${query ? `?${query}` : ""}`;

  const localeOptions = locales.map((locale) => ({
    value: locale,
    label: locale.toLocaleUpperCase(),
  }));

  return (
    <div className={styles.languageSwitcher}>
      <div className={styles.languageSwitcherButton}>
        <Button variant="secondary">
          <GlobeIcon />
        </Button>
      </div>

      <Dropdown
        className={styles.dropdown}
        options={localeOptions}
        value={currentLocale}
        onSelect={(newLocale) => {
          router.push(href, { locale: newLocale });
        }}
        renderOption={(option, isActive) => (
          <span
            className={`${styles.dropdownOption} ${
              isActive ? styles.active : ""
            }`}
          >
            {option.label}
          </span>
        )}
      />
    </div>
  );
}
