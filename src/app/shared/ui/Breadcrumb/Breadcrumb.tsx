"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Breadcrumb.module.css";

export default function Breadcrumb() {
  const t = useTranslations("Breadcrumb");
  const pathName = usePathname();

  // 1. Разбили путь на части и убрали пустые элементы
  const allPathSegments = pathName
    .split("/")
    .filter((segmentValue) => segmentValue !== "");

  // 2. Первым элементом идёт локаль — убираем её
  const [, ...relevantPathSegments] = allPathSegments;

  // locale — первый сегмент пути
  const localeSegment = allPathSegments[0];

  // 3. Строим список объектов { href, label }
  const breadcrumbItems = relevantPathSegments.map((segmentName, index) => {
    const href = `/${[
      localeSegment,
      ...relevantPathSegments.slice(0, index + 1),
    ].join("/")}`;
    const translationKey = segmentName;
    return {
      href,
      label: t(translationKey),
    };
  });

  return (
    <div className={styles.breadcrumbWrapper}>
      <nav aria-label="breadcrumb">
        <ol className={styles.breadcrumbList}>
          <li>
            <Link href={`/${localeSegment}`}>{t("homePage")}</Link>
          </li>
          {breadcrumbItems.map(({ href, label }) => {
            const isCurrent = href === pathName;

            return (
              <li key={href} className={styles.breadcrumbItem}>
                <span className={styles.separator}>/</span>
                {isCurrent ? (
                  <span className={styles.disabled}>{label}</span>
                ) : (
                  <Link href={href}>{label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
