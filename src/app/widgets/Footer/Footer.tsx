"use client";

import { useTranslations } from "next-intl";
import LogoIcon from "@/app/shared/Icons/logo.svg";
import ScrewdriverWrenchIcon from "@/app/shared/Icons/screwdriver-wrench.svg";
import InfoIcon from "@/app/shared/Icons/info.svg";
import ContactFormIcon from "@/app/shared/Icons/contact-form.svg";
import PhoneIcon from "@/app/shared/Icons/phone.svg";
import EmailIcon from "@/app/shared/Icons/mail.svg";
import MapPinIcon from "@/app/shared/Icons/map-pin.svg";
import ClockIcon from "@/app/shared/Icons/clock.svg";
import Link from "next/link";
import { getServiceOptions } from "@/app/shared/data/serviceOptions";
import { ebGaramond } from "@/app/shared/ui/fonts";
import styles from "./Footer.module.css";
import { FaInstagram, FaFacebookF, FaTelegram } from "react-icons/fa";

export default function Footer() {
  const t = useTranslations("Footer");
  const options = getServiceOptions();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.motto}>
          <Link href="/" className={styles.logoLink}>
            <LogoIcon className={styles.logoIcon} />
          </Link>
          <p className={`${ebGaramond.className} ${styles.mottoText}`}>
            <strong>PDR STUDIO</strong> {t("motto")}
          </p>
        </div>

        <div className={styles.services}>
          <h3>{t("services")}</h3>
          <ul>
            {options.map((opt) => (
              <li key={opt.value}>
                <Link href={`/services/${opt.value}`}>
                  <ScrewdriverWrenchIcon className={styles.icon} />
                  {opt.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.usefulLinks}>
          <h3>{t("usefulLinks")}</h3>
          <ul>
            <li>
              <Link href="#about">
                <InfoIcon className={styles.icon} />
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="#contactUs">
                <ContactFormIcon className={styles.icon} />
                {t("contactUs")}
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.contacts}>
          <h3>{t("contactsInfo")}</h3>
          <ul>
            <li>
              <Link href="tel:+3361234567">
                <PhoneIcon className={styles.icon} />
                +3361234567
              </Link>
            </li>
            <li>
              <Link href="mailto:info@example.com">
                <EmailIcon className={styles.icon} />
                info@example.com
              </Link>
            </li>
            <li>
              <Link
                href="https://www.google.com/maps?q=1234+Placeholder+St,+City,+Country"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPinIcon className={styles.icon} />
                Address
              </Link>
            </li>
            <li>
              <ClockIcon className={styles.icon} /> {t("businessHours")}
            </li>
            <li>
              <strong className={styles.socialTitle}>{t("socialTitle")}</strong>
              <ul className={styles.socialList}>
                <li className={styles.socialItem}>
                  <Link href="#">
                    <FaFacebookF className={styles.facebookIcon} />
                  </Link>
                </li>
                <li className={styles.socialItem}>
                  <Link href="#">
                    <FaInstagram className={styles.instagramIcon} />
                  </Link>
                </li>
                <li className={styles.socialItem}>
                  <Link href="#">
                    <FaTelegram className={styles.telegramIcon} />
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* <hr /> */}
      <p className={styles.copyright}>© PDR STUDIO - {t("copyright")} 2025</p>
    </footer>
  );
}
