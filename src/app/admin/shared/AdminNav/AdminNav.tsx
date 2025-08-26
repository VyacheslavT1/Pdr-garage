"use client"; // Компонент интерактивный: используем usePathname для подсветки активного пункта

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.scss";

// Тип одного пункта меню
type AdminNavItem = {
  href: string; // абсолютный путь внутри админки
  label: string; // подпись ссылки на русском
};

export default function AdminNav() {
  // Текущий путь: нужен, чтобы подсвечивать активный пункт
  const currentPathname = usePathname();

  // Набор ссылок админ-панели (минимум из ТЗ)
  const navigationItems: AdminNavItem[] = [
    { href: "/admin", label: "Главная" },
    { href: "/admin/blocks", label: "Блоки сайта" },
    { href: "/admin/portfolio", label: "Портфолио" },
    { href: "/admin/reviews", label: "Отзывы" },
    { href: "/admin/requests", label: "Заявки" },
  ];

  // Вспомогательная функция: активен ли пункт (учитываем подстраницы, например /admin/blocks/123)
  function isItemActive(itemHref: string, pathname: string): boolean {
    // Спец-правило для главной: активна только на точном /admin
    if (itemHref === "/admin") {
      return pathname === "/admin";
    }
    // Для остальных разделов: точное совпадение ИЛИ вложенные пути (/admin/blocks/123)
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  }

  return (
    <nav className={styles.navRoot} aria-label="Навигация админ-панели">
      <div className={styles.innerContainer}>
        <ul className={styles.navList}>
          {navigationItems.map((navigationItem) => {
            const active = isItemActive(navigationItem.href, currentPathname);
            return (
              <li className={styles.navItem} key={navigationItem.href}>
                <Link
                  href={navigationItem.href}
                  className={`${styles.navLink} ${
                    active ? styles.navLinkActive : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {navigationItem.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
