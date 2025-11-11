import { useTranslations } from "next-intl";
import LinkButton from "@/shared/ui/link-button/LinkButton";
import styles from "./HeroSection.module.scss";

export default function HeroSection() {
  const t = useTranslations("HeroSection");
  return (
    <section className={styles.heroSection}>
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <h1 className={styles.title}>{t("title")}</h1>
          <h3 className={styles.subtitle}>{t("subtitle")}</h3>
          <div className={styles.actions}>
            <LinkButton href="/services">{t("allServicesLink")}</LinkButton>
            <LinkButton href="/services/paintlessDentRemoval">{t("detailsLink")}</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
