import { useTranslations } from "next-intl";
import Image from "next/image";
import LinkButton from "@/app/shared/ui/LinkButton/LinkButton";
import ArrowRight from "@/app/shared/Icons/arrow-right-long.svg";
import styles from "./ShortDescription.module.css";

export default function AboutUs() {
  const t = useTranslations("AboutUs");
  const beforeImageUrl = "https://picsum.photos/id/133/600/400";
  const afterImageUrl = "https://picsum.photos/id/133/600/400";
  return (
    <section className={styles.aboutWrapper}>
      <div className={styles.aboutContainer}>
        <div className={styles.textContainer}>
          <div className={styles.titleContainer}>
            <h3>{t("fewWords")}</h3>
            <h2>{t("aboutPdrStudio")}</h2>
          </div>
          <div className={styles.description}>
            <p>{t("about1")}</p>
            <p>{t("about2")}</p>
            <p>{t("about3")}</p>
            <p>{t("about4")}</p>
          </div>
          <div className={styles.actions}>
            <LinkButton href="/about">
              {t("detailsLink")}
              <ArrowRight />
            </LinkButton>
          </div>
        </div>
        {/* здесь будут две фотографии  */}
        <div className={styles.gallery}>
          <div className={styles.imageBeforeContainer}>
            <Image src={beforeImageUrl} alt={t("beforeImageAlt")} fill />
          </div>
          <div className={styles.imageAfterContainer}>
            <Image src={afterImageUrl} alt={t("afterImageAlt")} fill />
          </div>
        </div>
      </div>
    </section>
  );
}
