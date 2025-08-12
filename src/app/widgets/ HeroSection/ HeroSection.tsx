// app/widgets/HeroSection/HeroSection.tsx
import { useTranslations } from "next-intl";
import LinkButton from "@/app/shared/ui/LinkButton/LinkButton";
import Image from "next/image";
import MainPicture from "@/app/shared/Images/main-picture.avif";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  const t = useTranslations("HeroSection");
  return (
    <section className={styles.heroSection}>
      <Image
        src={MainPicture}
        alt={t("mainPictureAlt")}
        fill
        className={styles.heroImage}
      />
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <h1 className={styles.title}>{t("title").toLocaleUpperCase()}</h1>
          <h3 className={styles.subtitle}>{t("subtitle")}</h3>
          <div className={styles.actions}>
            <LinkButton href="/services">
              {t("allServicesLink").toLocaleUpperCase()}
            </LinkButton>
            <LinkButton href="/services/paintlessDentRemoval">
              {t("detailsLink").toLocaleUpperCase()}
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
