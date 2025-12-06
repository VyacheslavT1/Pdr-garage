import { useTranslations } from "next-intl";
import LinkButton from "@/shared/ui/link-button/LinkButton";
import styles from "./PrivacyPolicy.module.scss";

export default function PrivacyPolicy() {
  const t = useTranslations("PrivacyPolicy");

  const sections: Array<{
    id: string;
    title: string;
    paragraphs?: string[];
    list?: string[];
  }> = [
    {
      id: "controller",
      title: t("sections.controller.title"),
      paragraphs: t.raw("sections.controller.paragraphs") as string[],
    },
    {
      id: "data",
      title: t("sections.data.title"),
      list: t.raw("sections.data.items") as string[],
    },
    {
      id: "purposes",
      title: t("sections.purposes.title"),
      list: t.raw("sections.purposes.items") as string[],
    },
    {
      id: "legalBases",
      title: t("sections.legalBases.title"),
      list: t.raw("sections.legalBases.items") as string[],
    },
    {
      id: "retention",
      title: t("sections.retention.title"),
      list: t.raw("sections.retention.items") as string[],
    },
    {
      id: "sharing",
      title: t("sections.sharing.title"),
      paragraphs: t.raw("sections.sharing.paragraphs") as string[],
      list: t.raw("sections.sharing.items") as string[],
    },
    {
      id: "rights",
      title: t("sections.rights.title"),
      paragraphs: t.raw("sections.rights.paragraphs") as string[],
      list: t.raw("sections.rights.items") as string[],
    },
    {
      id: "security",
      title: t("sections.security.title"),
      paragraphs: t.raw("sections.security.paragraphs") as string[],
    },
    {
      id: "cookies",
      title: t("sections.cookies.title"),
      list: t.raw("sections.cookies.items") as string[],
    },
    {
      id: "changes",
      title: t("sections.changes.title"),
      paragraphs: t.raw("sections.changes.paragraphs") as string[],
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.updated}>{t("updated", { year: "2025" })}</p>
          <h1 className={styles.mainTitle}>{t("title")}</h1>
        </header>

        <div className={styles.content}>
          {sections.map((section) => (
            <section
              key={section.id}
              className={styles.section}
              id={section.id}
            >
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.paragraphs?.map((paragraph, idx) => (
                <p key={`${section.id}-p-${idx}`} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className={styles.list}>
                  {section.list.map((item, idx) => (
                    <li key={`${section.id}-li-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <div className={styles.actions}>
          <LinkButton href="/contacts?consent=reject">
            {t("actions.decline")}
          </LinkButton>
          <LinkButton href="/contacts?consent=accept">
            {t("actions.accept")}
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
