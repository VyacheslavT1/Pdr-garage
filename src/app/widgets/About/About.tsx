import { useTranslations } from "next-intl";
import Image from "next/image";
import Button from "@/app/shared/ui/Button/Button";
import ArrowRight from "@/app/shared/Icons/arrow-right-long.svg";
import styles from "./About.module.css";

export default function AboutUs() {
  const t = useTranslations("AboutUs");
  const beforeImageUrl = "https://picsum.photos/id/133/600/400";
  const afterImageUrl = "https://picsum.photos/id/133/600/400";
  return (
    <section className={styles.about}>
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
          <Button variant="primary">
            {t("detailsButton")}
            <ArrowRight />
          </Button>
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
    </section>
  );
}
