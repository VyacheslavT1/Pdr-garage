"use client"; // Компонент интерактивный: используем usePathname для подсветки активного пункта

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Space, Button } from "antd";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.scss";

// Тип одного пункта меню
type AdminNavItem = {
  href: string; // абсолютный путь внутри админки
  label: string; // подпись ссылки
};

export default function AdminNav() {
  // Текущий путь: нужен, чтобы подсвечивать активный пункт
  const currentPathname = usePathname();
  const routerInstance = useRouter();
  const [isLogoutInProgress, setIsLogoutInProgress] = useState<boolean>(false);
  const [logoutError, setLogoutError] = useState<string>("");

  // Набор ссылок админ-панели
  const navigationItems: AdminNavItem[] = [
    { href: "/admin", label: "Accueil" },
    { href: "/admin/requests", label: "Demandes" },
    { href: "/admin/reviews", label: "Avis" },
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

  async function handleLogoutClick() {
    try {
      setIsLogoutInProgress(true);
      setLogoutError("");
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        setLogoutError("Échec de la déconnexion");
        return;
      }
      routerInstance.push("/admin/login");
    } catch {
      setLogoutError("Erreur réseau lors de la déconnexion");
    } finally {
      setIsLogoutInProgress(false);
    }
  }

  return (
    <header className={styles.header}>
      <nav className={styles.navRoot} aria-label="Навигация админ-панели">
        <div className={styles.innerContainer}>
          <ul className={styles.navList}>
            {navigationItems.map((navigationItem) => {
              const active = isItemActive(navigationItem.href, currentPathname);
              return (
                <li key={navigationItem.href}>
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
      <div className={styles.actions}>
        <Space>
          <Button
            danger
            type="primary"
            onClick={handleLogoutClick}
            loading={isLogoutInProgress}
            aria-label="Se déconnecter"
          >
            Se déconnecter
          </Button>
          {logoutError && (
            <span className={styles.errorMessage} role="alert">
              {logoutError}
            </span>
          )}
        </Space>
      </div>
    </header>
  );
}
