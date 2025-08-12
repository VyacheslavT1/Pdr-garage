"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import styles from "./LinkButton.module.scss";

export interface LinkButtonProps {
  href: string;
  // variant: "primary" | "secondary";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  children,
  icon,
  ...props
}) => {
  const locale = useLocale();

  const localizedHref = href.startsWith("/")
    ? `/${locale}${href}`
    : `/${locale}/${href}`;

  return (
    <Link href={localizedHref} className={styles.link} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </Link>
  );
};
export default LinkButton;
