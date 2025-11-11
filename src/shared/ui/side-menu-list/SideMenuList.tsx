"use client";

import React from "react";
import Link from "next/link";
import styles from "./SideMenuList.module.scss";

export interface SideMenuItem { href: string; label: string }

interface SideMenuListProps { items: SideMenuItem[]; titleText?: string }

export default function SideMenuList({ items, titleText }: SideMenuListProps) {
  return (
    <aside className={styles.sideMenu} aria-label={titleText ?? "Side menu"}>
      <ul>
        {items.map((item) => (
          <li key={item.href} className={styles.menuItem}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

