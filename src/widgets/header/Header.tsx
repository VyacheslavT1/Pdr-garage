"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import LogoIcon from "@/shared/Icons/logo.svg";
import ChevronDownIcon from "@/shared/Icons/chevron-down.svg";
import ChevronUpIcon from "@/shared/Icons/chevron-up.svg";
import MenuIcon from "@/shared/Icons/menu.svg";
import CloseIcon from "@/shared/Icons/close.svg";
import Button from "@/shared/ui/button/Button";
import LinkButton from "@/shared/ui/link-button/LinkButton";
import Dropdown from "@/shared/ui/dropdown/Dropdown";
import { LanguageSwitcher } from "@/modules/i18n/feature/language-switcher/ui/LanguageSwitcher";
import { useServiceOptions } from "@/shared/config/data/serviceOptions";
import { useTranslations } from "next-intl";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const serviceRefWrapper = useRef<HTMLLIElement>(null);
  const serviceOptions = useServiceOptions();
  const t = useTranslations("Header");

  useEffect(() => {
    if (!isServicesOpen) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (
        serviceRefWrapper.current &&
        !serviceRefWrapper.current.contains(event.target as Node)
      ) {
        setIsServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
  }, [isServicesOpen]);

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logoLink}>
          <LogoIcon className={styles.logoIcon} />
        </Link>

        <ul className={styles.menuList}>
          <li>
            <Link href="/" className={styles.menuLink}>
              {t("home")}
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/services" className={styles.servicesLink}>
              {t("services")}
              <ChevronDownIcon className={styles.chevronDownIcon} />
              <ChevronUpIcon className={styles.chevronUpIcon} />
            </Link>
            <Dropdown
              className={styles.serviceOptions}
              options={serviceOptions}
            />
          </li>
          <li>
            <Link href="/aboutUs" className={styles.menuLink}>
              {t("about")}
            </Link>
          </li>
          <li>
            <Link href="/blog" className={styles.menuLink}>
              {t("blog")}
            </Link>
          </li>
          <li>
            <Link href="/contacts" className={styles.menuLink}>
              {t("contacts")}
            </Link>
          </li>
        </ul>

        <div className={styles.controls}>
          <div className={styles.requestQuoteButton}>
            <LinkButton href="/contacts">{t("requestQuoteButton")}</LinkButton>
          </div>
          <div className={styles.languageSwitcher}>
            <LanguageSwitcher />
          </div>

          {!isMenuOpen && (
            <div className={styles.menuButton}>
              <Button
                variant="secondary"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </Button>
            </div>
          )}
        </div>

        <div
          className={`${styles.mobileMenuOverlay} ${
            isMenuOpen
              ? styles["mobileMenuOverlay--open"]
              : styles["mobileMenuOverlay--closed"]
          }`}
        >
          <div className={styles.closeButtonWrapper}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsMenuOpen(false);
                setIsServicesOpen(false);
              }}
              aria-label="Close menu"
            >
              <CloseIcon />
            </Button>
          </div>

          <ul className={styles.mobileMenuList}>
            <li>
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                {t("home")}
              </Link>
            </li>
            <li ref={serviceRefWrapper} className={styles.mobileServiceItem}>
              <Link
                href="/services"
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                {t("services")}
                <span
                  className={styles.serviceOptionsIcon}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsServicesOpen((o) => !o);
                  }}
                >
                  {isServicesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </span>
              </Link>
              <div
                className={`${styles.serviceOptionsWrapper} ${
                  isServicesOpen
                    ? styles["serviceOptionsWrapper--open"]
                    : styles["serviceOptionsWrapper--closed"]
                }`}
              >
                <Dropdown
                  options={serviceOptions}
                  onClose={() => setIsServicesOpen(false)}
                  onSelect={() => setIsMenuOpen(false)}
                />
              </div>
            </li>
            <li>
              <Link href="/aboutUs" onClick={() => setIsMenuOpen(false)}>
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/blog" onClick={() => setIsMenuOpen(false)}>
                {t("blog")}
              </Link>
            </li>
            <li>
              <Link href="/contacts" onClick={() => setIsMenuOpen(false)}>
                {t("contacts")}
              </Link>
            </li>
            <li className={styles.callToAction}>
              <Button variant="primary">{t("requestQuoteButton")}</Button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
