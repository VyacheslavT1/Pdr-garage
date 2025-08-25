// app/widgets/Header/Header.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import LogoIcon from "@/app/shared/Icons/logo.svg";
import ChevronDownIcon from "@/app/shared/Icons/chevron-down.svg";
import ChevronUpIcon from "@/app/shared/Icons/chevron-up.svg";
import MenuIcon from "@/app/shared/Icons/menu.svg";
import CloseIcon from "@/app/shared/Icons/close.svg";
import Button from "@/app/shared/ui/Button/Button";
import LinkButton from "@/app/shared/ui/LinkButton/LinkButton";
import Dropdown from "@/app/shared/ui/Dropdown/Dropdown";
import { LanguageSwitcher } from "@/app/shared/ui/LanguageSwitcher/LanguageSwitcher";
import { getServiceOptions } from "../../shared/data/serviceOptions";
import { useTranslations } from "next-intl";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const serviceRefWrapper = useRef<HTMLLIElement>(null);
  const serviceOptions = getServiceOptions();
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
        {/* Логотип */}
        <Link href="/" className={styles.logoLink}>
          <LogoIcon className={styles.logoIcon} />
        </Link>

        {/* Десктоп-меню */}
        <ul className={styles.menuList}>
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
          {/* <li>
            <Link href="/store" className={styles.menuLink}>
              {t("store")}
            </Link>
          </li> */}
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

        {/* Десктопные контролы */}
        <div className={styles.controls}>
          <div className={styles.requestQuoteButton}>
            <LinkButton href="/contacts">{t("requestQuoteButton")}</LinkButton>
          </div>
          <LanguageSwitcher />
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

        {/* Мобильное меню-оверлей */}
        <div
          className={`${styles.mobileMenuOverlay} ${
            isMenuOpen
              ? styles["mobileMenuOverlay--open"]
              : styles["mobileMenuOverlay--closed"]
          }`}
        >
          {/* Кнопка закрытия */}
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
            <li ref={serviceRefWrapper} className={styles.mobileServiceItem}>
              {/* Триггер */}
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

              {/* Обёртка с анимацией max-height */}
              <div
                className={`
                  ${styles.serviceOptionsWrapper}
                  ${
                    isServicesOpen
                      ? styles["serviceOptionsWrapper--open"]
                      : styles["serviceOptionsWrapper--closed"]
                  }
                `}
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
            {/* <li>
              <Link href="/store" onClick={() => setIsMenuOpen(false)}>
                {t("store")}
              </Link>
            </li> */}
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
