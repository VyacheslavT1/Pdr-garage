"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Breadcrumb.module.scss";

export default function Breadcrumb() {
  const t = useTranslations("Breadcrumb");
  const pathName = usePathname();
  const allPathSegments = pathName.split("/").filter((s) => s !== "");
  const [localeSegment, ...relevantPathSegments] = allPathSegments;

  const breadcrumbItems = relevantPathSegments.map((segmentName, index) => {
    const href = `/${[localeSegment, ...relevantPathSegments.slice(0, index + 1)].join("/")}`;
    return { href, label: t(segmentName) };
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
              <li key={href}>
                <span className={styles.separator}>/</span>
                {isCurrent ? <span className={styles.disabled}>{label}</span> : <Link href={href}>{label}</Link>}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

