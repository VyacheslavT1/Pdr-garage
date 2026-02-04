import React from "react";
import styles from "./AdminLayout.module.scss";
import AdminProviders from "./AdminProviders";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProviders>
      <div className={styles.adminRoot}>{children}</div>
    </AdminProviders>
  );
}
